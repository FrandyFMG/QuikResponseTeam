(function () {
  "use strict";

  var titleFields = ["title", "name", "label", "shortcut", "key"];
  var bodyFields = ["body", "text", "content", "response", "value", "message", "template", "snippet", "copy"];
  var categoryFields = ["category", "group", "folder", "type", "section"];
  var tagFields = ["tags", "tag", "keywords", "keyword", "labels"];
  var collectionFields = ["items", "snippets", "responses", "children", "entries"];

  var state = {
    snippets: [],
    categories: [],
    mode: "categories",
    activeCategory: "",
    visible: [],
    selectedIndex: 0,
    query: ""
  };

  var els = {
    search: document.getElementById("searchInput"),
    list: document.getElementById("optionList"),
    empty: document.getElementById("emptyState"),
    count: document.getElementById("resultCount"),
    toast: document.getElementById("toast"),
    mode: document.getElementById("modePill"),
    previewTitle: document.getElementById("previewTitle"),
    previewBody: document.getElementById("previewBody")
  };

  var toastTimer = 0;
  var closeTimer = 0;

  function getSnippetSource() {
    return window.responses || window.RESPONSES || window.snippets || window.SNIPPETS || window.quickTextResponses || window.QUICK_TEXT_RESPONSES || [];
  }

  function normalizeSource(source) {
    var snippets = [];

    function visit(value, context) {
      var nextContext = context || {};
      if (value == null) return;

      if (typeof value === "string" || typeof value === "number") {
        addSnippet({ title: nextContext.title || deriveTitle(String(value)), body: String(value), category: nextContext.category || "", tags: nextContext.tags || [] });
        return;
      }

      if (Array.isArray(value)) {
        value.forEach(function (entry, index) {
          visit(entry, { category: nextContext.category, tags: nextContext.tags, title: nextContext.title, index: index });
        });
        return;
      }

      if (typeof value !== "object") return;

      var body = pickString(value, bodyFields);
      var collectionKey = collectionFields.find(function (field) { return Array.isArray(value[field]); });

      if (!body && collectionKey) {
        visit(value[collectionKey], {
          category: pickString(value, categoryFields) || pickString(value, titleFields) || nextContext.category || "",
          tags: mergeTags(nextContext.tags, pickTags(value)),
          title: nextContext.title
        });
        return;
      }

      if (body || hasAnyField(value, titleFields.concat(categoryFields, tagFields))) {
        addSnippet({
          title: pickString(value, titleFields) || nextContext.title || deriveTitle(body || ""),
          body: stringifyBody(body || pickString(value, titleFields) || ""),
          category: pickString(value, categoryFields) || nextContext.category || "Uncategorized",
          tags: mergeTags(nextContext.tags, pickTags(value))
        });
        return;
      }

      Object.keys(value).forEach(function (key) {
        var entry = value[key];
        if (typeof entry === "string" || typeof entry === "number") {
          visit({ title: humanizeKey(key), body: String(entry) }, nextContext);
          return;
        }
        visit(entry, { category: nextContext.category || humanizeKey(key), tags: nextContext.tags, title: nextContext.title });
      });
    }

    function addSnippet(snippet) {
      var body = stringifyBody(snippet.body).trim();
      if (!body) return;
      var title = stringifyBody(snippet.title).trim() || deriveTitle(body);
      var category = stringifyBody(snippet.category).trim() || "Uncategorized";
      var tags = parseTags(snippet.tags);
      snippets.push({
        id: "snippet-" + snippets.length,
        title: title,
        body: body,
        category: category,
        tags: tags,
        haystack: [title, category, tags.join(" "), body].join(" ").toLowerCase()
      });
    }

    visit(source, {});
    return snippets;
  }

  function hasAnyField(obj, fields) {
    return fields.some(function (field) { return Object.prototype.hasOwnProperty.call(obj, field) && obj[field] != null && obj[field] !== ""; });
  }

  function pickString(obj, fields) {
    for (var i = 0; i < fields.length; i += 1) {
      var value = obj[fields[i]];
      if (value == null) continue;
      value = stringifyBody(value).trim();
      if (value) return value;
    }
    return "";
  }

  function pickTags(obj) {
    for (var i = 0; i < tagFields.length; i += 1) if (obj[tagFields[i]] != null) return obj[tagFields[i]];
    return [];
  }

  function mergeTags() {
    var merged = [];
    Array.prototype.slice.call(arguments).forEach(function (group) {
      parseTags(group).forEach(function (tag) { if (merged.indexOf(tag) === -1) merged.push(tag); });
    });
    return merged;
  }

  function parseTags(value) {
    if (value == null || value === "") return [];
    if (Array.isArray(value)) return value.reduce(function (acc, item) { parseTags(item).forEach(function (tag) { if (acc.indexOf(tag) === -1) acc.push(tag); }); return acc; }, []);
    if (typeof value === "object") return Object.keys(value).filter(function (key) { return Boolean(value[key]); });
    return String(value).split(/[;,|]/).map(function (tag) { return tag.trim(); }).filter(Boolean);
  }

  function stringifyBody(value) {
    if (value == null) return "";
    if (Array.isArray(value)) return value.map(stringifyBody).filter(Boolean).join("\n");
    return String(value);
  }

  function humanizeKey(value) {
    return String(value).replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim().replace(/\b\w/g, function (letter) { return letter.toUpperCase(); });
  }

  function deriveTitle(body) {
    var compact = squeeze(body);
    if (!compact) return "Untitled";
    return compact.length > 54 ? compact.slice(0, 51) + "..." : compact;
  }

  function squeeze(value) {
    return stringifyBody(value).replace(/\s+/g, " ").trim();
  }

  function buildCategories() {
    var map = {};
    state.snippets.forEach(function (snippet) {
      if (!map[snippet.category]) map[snippet.category] = 0;
      map[snippet.category] += 1;
    });
    state.categories = Object.keys(map).sort(function (a, b) { return a.localeCompare(b); }).map(function (name) {
      return { type: "category", title: name, count: map[name], meta: map[name] + " response" + (map[name] === 1 ? "" : "s") };
    });
  }

  function applyFilter() {
    var tokens = state.query.toLowerCase().split(/\s+/).filter(Boolean);

    if (tokens.length) {
      state.mode = "search";
      state.visible = state.snippets.filter(function (snippet) {
        return tokens.every(function (token) { return snippet.haystack.indexOf(token) !== -1; });
      }).map(function (snippet) { return { type: "snippet", snippet: snippet, title: snippet.title, meta: snippet.category }; });
    } else if (state.mode === "snippets") {
      state.visible = state.snippets.filter(function (snippet) { return snippet.category === state.activeCategory; }).map(function (snippet) {
        return { type: "snippet", snippet: snippet, title: snippet.title, meta: squeeze(snippet.body) };
      });
    } else {
      state.mode = "categories";
      state.activeCategory = "";
      state.visible = state.categories.slice();
    }

    if (state.selectedIndex >= state.visible.length) state.selectedIndex = Math.max(0, state.visible.length - 1);
    if (!state.visible.length) state.selectedIndex = 0;
    render();
  }

  function render() {
    var fragment = document.createDocumentFragment();

    state.visible.forEach(function (entry, index) {
      var item = document.createElement("li");
      var button = document.createElement("button");
      var number = document.createElement("span");
      var main = document.createElement("span");
      var title = document.createElement("span");
      var meta = document.createElement("span");

      item.className = "option-item" + (index === state.selectedIndex ? " is-selected" : "");
      item.id = entry.type + "-" + index;
      item.setAttribute("role", "option");
      item.setAttribute("aria-selected", index === state.selectedIndex ? "true" : "false");

      button.className = "option-button";
      button.type = "button";
      button.dataset.index = String(index);
      button.setAttribute("aria-label", entry.type === "category" ? "Open " + entry.title : "Copy " + entry.title);

      number.className = "option-number";
      number.textContent = index < 9 ? String(index + 1) : "";
      number.setAttribute("aria-hidden", "true");

      main.className = "option-main";
      title.className = "option-title";
      title.textContent = entry.title;
      meta.className = "option-meta";
      meta.textContent = entry.meta || "";

      main.appendChild(title);
      main.appendChild(meta);
      button.appendChild(number);
      button.appendChild(main);
      button.addEventListener("click", function () { chooseIndex(index); });
      button.addEventListener("mouseenter", function () { state.selectedIndex = index; updatePreview(); renderSelectionOnly(); });

      item.appendChild(button);
      fragment.appendChild(item);
    });

    els.list.replaceChildren(fragment);
    els.empty.hidden = state.visible.length > 0;
    els.count.textContent = countLabel();
    els.mode.textContent = modeLabel();
    updateActiveDescendant();
    updatePreview();
  }

  function renderSelectionOnly() {
    Array.prototype.slice.call(els.list.children).forEach(function (item, index) {
      item.classList.toggle("is-selected", index === state.selectedIndex);
      item.setAttribute("aria-selected", index === state.selectedIndex ? "true" : "false");
    });
    updateActiveDescendant();
  }

  function countLabel() {
    if (state.mode === "categories") return state.categories.length + " categories, " + state.snippets.length + " snippets";
    if (state.mode === "snippets") return state.activeCategory + " - " + state.visible.length + " snippets";
    return state.visible.length + " search result" + (state.visible.length === 1 ? "" : "s");
  }

  function modeLabel() {
    if (state.mode === "categories") return "Categories";
    if (state.mode === "snippets") return state.activeCategory;
    return "Search";
  }

  function updateActiveDescendant() {
    var active = state.visible[state.selectedIndex];
    if (active) els.search.setAttribute("aria-activedescendant", active.type + "-" + state.selectedIndex);
    else els.search.removeAttribute("aria-activedescendant");
  }

  function updatePreview() {
    var entry = state.visible[state.selectedIndex];
    if (!entry) {
      els.previewTitle.textContent = "No match";
      els.previewBody.textContent = "Try another search.";
      return;
    }
    if (entry.type === "category") {
      els.previewTitle.textContent = entry.title;
      els.previewBody.textContent = "Press " + (state.selectedIndex + 1) + " to open this category.\n\nThen press a response number to copy it.";
      return;
    }
    els.previewTitle.textContent = entry.snippet.title;
    els.previewBody.textContent = entry.snippet.body;
  }

  function chooseIndex(index) {
    var entry = state.visible[index];
    if (!entry) return;
    state.selectedIndex = index;
    if (entry.type === "category") {
      state.mode = "snippets";
      state.activeCategory = entry.title;
      state.query = "";
      els.search.value = "";
      state.selectedIndex = 0;
      applyFilter();
      return;
    }
    copySnippet(entry.snippet);
  }

  function moveSelection(delta) {
    if (!state.visible.length) return;
    state.selectedIndex = (state.selectedIndex + delta + state.visible.length) % state.visible.length;
    renderSelectionOnly();
    updatePreview();
    scrollSelectedIntoView();
  }

  function scrollSelectedIntoView() {
    var selected = els.list.querySelector(".option-item.is-selected");
    if (selected) selected.scrollIntoView({ block: "nearest" });
  }

  function goBack() {
    if (state.query) {
      state.query = "";
      els.search.value = "";
      state.mode = state.activeCategory ? "snippets" : "categories";
      state.selectedIndex = 0;
      applyFilter();
      return;
    }
    if (state.mode === "snippets") {
      state.mode = "categories";
      state.activeCategory = "";
      state.selectedIndex = 0;
      applyFilter();
      return;
    }
    showToast("Ready");
  }

  function copySnippet(snippet) {
    copyText(snippet.body).then(function () {
      showToast("Copied: " + snippet.title);
      window.clearTimeout(closeTimer);
      closeTimer = window.setTimeout(function () {
        try { window.close(); } catch (error) {}
      }, 350);
    }).catch(function () {
      showToast("Copy failed");
    });
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text).catch(function () { return fallbackCopyText(text); });
    return fallbackCopyText(text);
  }

  function fallbackCopyText(text) {
    return new Promise(function (resolve, reject) {
      var textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.setAttribute("readonly", "");
      textArea.style.position = "fixed";
      textArea.style.top = "-1000px";
      textArea.style.left = "-1000px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try { document.execCommand("copy") ? resolve() : reject(new Error("Copy command failed")); }
      catch (error) { reject(error); }
      finally { document.body.removeChild(textArea); }
    });
  }

  function showToast(message) {
    window.clearTimeout(toastTimer);
    els.toast.textContent = message;
    els.toast.classList.add("is-visible");
    toastTimer = window.setTimeout(function () { els.toast.classList.remove("is-visible"); }, 1200);
  }

  function onKeyDown(event) {
    if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "f") {
      event.preventDefault();
      els.search.focus();
      els.search.select();
      return;
    }

    if (event.key === "ArrowDown") { event.preventDefault(); moveSelection(1); return; }
    if (event.key === "ArrowUp") { event.preventDefault(); moveSelection(-1); return; }
    if (event.key === "Enter") { event.preventDefault(); chooseIndex(state.selectedIndex); return; }
    if (event.key === "Escape") { event.preventDefault(); goBack(); return; }

    if (!event.altKey && !event.metaKey && !event.ctrlKey && /^[1-9]$/.test(event.key)) {
      var index = Number(event.key) - 1;
      if (state.visible[index]) {
        event.preventDefault();
        chooseIndex(index);
      }
    }
  }

  function onSearchInput() {
    state.query = els.search.value;
    state.selectedIndex = 0;
    applyFilter();
  }

  function init() {
    state.snippets = normalizeSource(getSnippetSource());
    buildCategories();
    els.search.addEventListener("input", onSearchInput);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("focus", function () { setTimeout(function () { els.search.focus(); }, 50); });
    applyFilter();
    setTimeout(function () { els.search.focus(); }, 50);
  }

  init();
})();
