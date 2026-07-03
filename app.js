(function () {
  "use strict";

  var titleFields = ["title", "name", "label", "shortcut", "key"];
  var bodyFields = ["body", "text", "content", "response", "value", "message", "template", "snippet", "copy"];
  var categoryFields = ["category", "group", "folder", "type", "section"];
  var tagFields = ["tags", "tag", "keywords", "keyword", "labels"];
  var collectionFields = ["items", "snippets", "responses", "children", "entries"];

  var state = {
    snippets: [],
    visible: [],
    selectedIndex: 0,
    query: ""
  };

  var els = {
    search: document.getElementById("searchInput"),
    list: document.getElementById("snippetList"),
    empty: document.getElementById("emptyState"),
    count: document.getElementById("resultCount"),
    toast: document.getElementById("toast")
  };

  var toastTimer = 0;

  function getSnippetSource() {
    if (typeof responses !== "undefined") return responses;
    if (typeof RESPONSES !== "undefined") return RESPONSES;
    if (typeof snippets !== "undefined") return snippets;
    if (typeof SNIPPETS !== "undefined") return SNIPPETS;
    if (typeof quickTextResponses !== "undefined") return quickTextResponses;
    if (typeof QUICK_TEXT_RESPONSES !== "undefined") return QUICK_TEXT_RESPONSES;

    return (
      window.responses ||
      window.RESPONSES ||
      window.snippets ||
      window.SNIPPETS ||
      window.quickTextResponses ||
      window.QUICK_TEXT_RESPONSES ||
      []
    );
  }

  function normalizeSource(source) {
    var snippets = [];

    function visit(value, context) {
      var nextContext = context || {};

      if (value == null) return;

      if (typeof value === "string" || typeof value === "number") {
        addSnippet({
          title: nextContext.title || deriveTitle(String(value)),
          body: String(value),
          category: nextContext.category || "",
          tags: nextContext.tags || []
        });
        return;
      }

      if (Array.isArray(value)) {
        value.forEach(function (entry, index) {
          visit(entry, {
            category: nextContext.category,
            tags: nextContext.tags,
            title: nextContext.title,
            index: index
          });
        });
        return;
      }

      if (typeof value !== "object") return;

      var body = pickString(value, bodyFields);
      var collectionKey = collectionFields.find(function (field) {
        return Array.isArray(value[field]);
      });

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
          category: pickString(value, categoryFields) || nextContext.category || "",
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

        visit(entry, {
          category: nextContext.category || humanizeKey(key),
          tags: nextContext.tags,
          title: nextContext.title
        });
      });
    }

    function addSnippet(snippet) {
      var body = stringifyBody(snippet.body).trim();
      if (!body) return;

      var title = stringifyBody(snippet.title).trim() || deriveTitle(body);
      var category = stringifyBody(snippet.category).trim();
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
    return fields.some(function (field) {
      return Object.prototype.hasOwnProperty.call(obj, field) && obj[field] != null && obj[field] !== "";
    });
  }

  function pickString(obj, fields) {
    for (var i = 0; i < fields.length; i += 1) {
      var field = fields[i];
      if (obj[field] == null) continue;

      var value = stringifyBody(obj[field]).trim();
      if (value) return value;
    }

    return "";
  }

  function pickTags(obj) {
    for (var i = 0; i < tagFields.length; i += 1) {
      if (obj[tagFields[i]] != null) return obj[tagFields[i]];
    }

    return [];
  }

  function mergeTags() {
    var merged = [];
    Array.prototype.slice.call(arguments).forEach(function (group) {
      parseTags(group).forEach(function (tag) {
        if (merged.indexOf(tag) === -1) merged.push(tag);
      });
    });

    return merged;
  }

  function parseTags(value) {
    if (value == null || value === "") return [];

    if (Array.isArray(value)) {
      return value.reduce(function (acc, item) {
        parseTags(item).forEach(function (tag) {
          if (acc.indexOf(tag) === -1) acc.push(tag);
        });
        return acc;
      }, []);
    }

    if (typeof value === "object") {
      return Object.keys(value).filter(function (key) {
        return Boolean(value[key]);
      });
    }

    return String(value)
      .split(/[;,|]/)
      .map(function (tag) {
        return tag.trim();
      })
      .filter(Boolean);
  }

  function stringifyBody(value) {
    if (value == null) return "";
    if (Array.isArray(value)) return value.map(stringifyBody).filter(Boolean).join("\n");
    return String(value);
  }

  function humanizeKey(value) {
    return String(value)
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b\w/g, function (letter) {
        return letter.toUpperCase();
      });
  }

  function deriveTitle(body) {
    var compact = squeeze(body);
    if (!compact) return "Untitled";
    return compact.length > 54 ? compact.slice(0, 51) + "..." : compact;
  }

  function squeeze(value) {
    return stringifyBody(value).replace(/\s+/g, " ").trim();
  }

  function applyFilter() {
    var tokens = state.query
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);

    state.visible = tokens.length
      ? state.snippets.filter(function (snippet) {
          return tokens.every(function (token) {
            return snippet.haystack.indexOf(token) !== -1;
          });
        })
      : state.snippets.slice();

    if (state.selectedIndex >= state.visible.length) state.selectedIndex = Math.max(0, state.visible.length - 1);
    if (!state.query) state.selectedIndex = 0;
    render();
  }

  function render() {
    var fragment = document.createDocumentFragment();

    state.visible.forEach(function (snippet, index) {
      var item = document.createElement("li");
      var button = document.createElement("button");
      var number = document.createElement("span");
      var main = document.createElement("span");
      var head = document.createElement("span");
      var title = document.createElement("span");
      var preview = document.createElement("span");

      item.className = "snippet-item" + (index === state.selectedIndex ? " is-selected" : "");
      item.id = snippet.id;
      item.setAttribute("role", "option");
      item.setAttribute("aria-selected", index === state.selectedIndex ? "true" : "false");

      button.className = "snippet-button";
      button.type = "button";
      button.dataset.index = String(index);
      button.setAttribute("aria-label", "Copy " + snippet.title);

      number.className = "snippet-number";
      number.textContent = index < 9 ? String(index + 1) : "";
      number.setAttribute("aria-hidden", "true");

      main.className = "snippet-main";
      head.className = "snippet-head";

      title.className = "snippet-title";
      title.textContent = snippet.title;

      head.appendChild(title);

      if (snippet.category) {
        var category = document.createElement("span");
        category.className = "snippet-category";
        category.textContent = snippet.category;
        head.appendChild(category);
      }

      preview.className = "snippet-preview";
      preview.textContent = squeeze(snippet.body);

      main.appendChild(head);
      main.appendChild(preview);

      if (snippet.tags.length) {
        var tags = document.createElement("span");
        tags.className = "snippet-tags";
        snippet.tags.slice(0, 4).forEach(function (tagText) {
          var tag = document.createElement("span");
          tag.className = "tag";
          tag.textContent = "#" + tagText;
          tags.appendChild(tag);
        });
        main.appendChild(tags);
      }

      button.appendChild(number);
      button.appendChild(main);
      button.addEventListener("click", function () {
        state.selectedIndex = index;
        render();
        copySnippet(snippet);
      });

      item.appendChild(button);
      fragment.appendChild(item);
    });

    els.list.replaceChildren(fragment);
    els.empty.hidden = state.visible.length > 0;
    els.count.textContent = countLabel();
    updateActiveDescendant();
  }

  function countLabel() {
    var total = state.snippets.length;
    var shown = state.visible.length;
    if (!total) return "No snippets found";
    if (shown === total) return total + " snippet" + (total === 1 ? "" : "s");
    return shown + " of " + total + " snippets";
  }

  function updateActiveDescendant() {
    var active = state.visible[state.selectedIndex];
    if (active) {
      els.search.setAttribute("aria-activedescendant", active.id);
    } else {
      els.search.removeAttribute("aria-activedescendant");
    }
  }

  function moveSelection(delta) {
    if (!state.visible.length) return;
    state.selectedIndex = (state.selectedIndex + delta + state.visible.length) % state.visible.length;
    render();
    scrollSelectedIntoView();
  }

  function scrollSelectedIntoView() {
    var selected = els.list.querySelector(".snippet-item.is-selected");
    if (selected) {
      selected.scrollIntoView({ block: "nearest" });
    }
  }

  function copyVisibleIndex(index) {
    var snippet = state.visible[index];
    if (!snippet) return;

    state.selectedIndex = index;
    render();
    scrollSelectedIntoView();
    copySnippet(snippet);
  }

  function copySnippet(snippet) {
    copyText(snippet.body)
      .then(function () {
        showToast("Copied");
      })
      .catch(function () {
        showToast("Copy failed");
      });
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).catch(function () {
        return fallbackCopyText(text);
      });
    }

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

      try {
        if (document.execCommand("copy")) {
          resolve();
        } else {
          reject(new Error("Copy command failed"));
        }
      } catch (error) {
        reject(error);
      } finally {
        document.body.removeChild(textArea);
      }
    });
  }

  function showToast(message) {
    window.clearTimeout(toastTimer);
    els.toast.textContent = message;
    els.toast.classList.add("is-visible");
    toastTimer = window.setTimeout(function () {
      els.toast.classList.remove("is-visible");
    }, 1200);
  }

  function onKeyDown(event) {
    if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "f") {
      event.preventDefault();
      els.search.focus();
      els.search.select();
      return;
    }

    if (event.ctrlKey && !event.shiftKey && /^[1-9]$/.test(event.key)) {
      event.preventDefault();
      copyVisibleIndex(Number(event.key) - 1);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveSelection(1);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      moveSelection(-1);
      return;
    }

    if (event.key === "Enter" && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
      event.preventDefault();
      if (state.visible[state.selectedIndex]) copySnippet(state.visible[state.selectedIndex]);
      return;
    }

    if (event.key === "Escape") {
      if (state.query || els.search.value) {
        event.preventDefault();
        els.search.value = "";
        state.query = "";
        state.selectedIndex = 0;
        applyFilter();
      }
    }
  }

  function init() {
    state.snippets = normalizeSource(getSnippetSource());
    state.visible = state.snippets.slice();

    els.search.addEventListener("input", function () {
      state.query = els.search.value.trim();
      state.selectedIndex = 0;
      applyFilter();
    });

    document.addEventListener("keydown", onKeyDown);
    render();
    els.search.focus();
  }

  init();
})();
