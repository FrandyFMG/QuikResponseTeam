const list = document.getElementById("responseList");
const searchBox = document.getElementById("searchBox");
const clearBtn = document.getElementById("clearBtn");
const statusBox = document.getElementById("status");
const categoryList = document.getElementById("categoryList");
const themeBtn = document.getElementById("themeBtn");

let visibleResponses = [];
let selectedCategory = "All";
let favorites = JSON.parse(localStorage.getItem("frandyAssistantFavorites") || "[]");
let darkMode = localStorage.getItem("frandyAssistantDark") === "true";

function saveFavorites() {
  localStorage.setItem("frandyAssistantFavorites", JSON.stringify(favorites));
}

function itemId(item) {
  return item.id || `${item.category}-${item.title}`.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function isFavorite(item) {
  return favorites.includes(itemId(item));
}

function toggleFavorite(item) {
  const id = itemId(item);
  favorites = favorites.includes(id) ? favorites.filter(x => x !== id) : [...favorites, id];
  saveFavorites();
  renderCategories();
  render();
}

function showStatus(message) {
  statusBox.textContent = message;
  setTimeout(() => {
    if (statusBox.textContent === message) statusBox.textContent = "";
  }, 1800);
}

async function copyText(item) {
  try {
    await navigator.clipboard.writeText(item.text);
    showStatus(`Copied: ${item.title}`);
  } catch (err) {
    showStatus("Copy failed. Open with HTTPS/GitHub Pages, then try again.");
  }
}

function categoryEmoji(category) {
  const map = {
    All: "📚",
    Favorites: "⭐",
    Accounts: "👤",
    MFA: "📱",
    ServiceNow: "🎫",
    SAP: "📦",
    Teams: "💬",
    "Office 365": "📧",
    General: "✅"
  };
  return map[category] || "📁";
}

function getCategoryCounts() {
  const counts = { All: window.RESPONSES.length, Favorites: window.RESPONSES.filter(isFavorite).length };
  window.RESPONSES.forEach(item => {
    counts[item.category] = (counts[item.category] || 0) + 1;
  });
  return counts;
}

function renderCategories() {
  const counts = getCategoryCounts();
  const categories = ["All", "Favorites", ...Object.keys(counts).filter(c => c !== "All" && c !== "Favorites").sort()];
  categoryList.innerHTML = "";

  categories.forEach(category => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `category-btn ${selectedCategory === category ? "active" : ""}`;
    btn.innerHTML = `<span>${categoryEmoji(category)} ${escapeHtml(category)}</span><span class="count">${counts[category] || 0}</span>`;
    btn.addEventListener("click", () => {
      selectedCategory = category;
      renderCategories();
      render();
      searchBox.focus();
    });
    categoryList.appendChild(btn);
  });
}

function render() {
  const query = searchBox.value.trim().toLowerCase();

  visibleResponses = window.RESPONSES.filter(item => {
    const combined = `${item.title} ${item.category} ${item.text}`.toLowerCase();
    const matchesQuery = combined.includes(query);
    const matchesCategory = selectedCategory === "All" ||
      (selectedCategory === "Favorites" && isFavorite(item)) ||
      item.category === selectedCategory;
    return matchesQuery && matchesCategory;
  }).sort((a, b) => Number(isFavorite(b)) - Number(isFavorite(a)) || a.title.localeCompare(b.title));

  list.innerHTML = "";

  if (visibleResponses.length === 0) {
    list.innerHTML = `<div class="empty">No matching responses found.</div>`;
    return;
  }

  visibleResponses.forEach((item, index) => {
    const card = document.createElement("article");
    card.className = "card";
    const shortcut = index < 9 ? `<div class="shortcut">Ctrl + ${index + 1}</div>` : "";
    const star = isFavorite(item) ? "★" : "☆";

    card.innerHTML = `
      <div class="card-top">
        <div>
          <div class="title-row">
            <button class="favorite" type="button" title="Favorite">${star}</button>
            <h2 class="title">${escapeHtml(item.title)}</h2>
          </div>
          <span class="category">${escapeHtml(item.category)}</span>
        </div>
        <button class="copy-btn" type="button">Copy</button>
      </div>
      <div class="preview">${escapeHtml(item.text)}</div>
      ${shortcut}
    `;

    card.querySelector(".copy-btn").addEventListener("click", (event) => {
      event.stopPropagation();
      copyText(item);
    });
    card.querySelector(".favorite").addEventListener("click", (event) => {
      event.stopPropagation();
      toggleFavorite(item);
    });
    card.addEventListener("click", () => copyText(item));
    list.appendChild(card);
  });
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function applyTheme() {
  document.body.classList.toggle("dark", darkMode);
  themeBtn.textContent = darkMode ? "Light" : "Dark";
  localStorage.setItem("frandyAssistantDark", String(darkMode));
}

searchBox.addEventListener("input", render);
clearBtn.addEventListener("click", () => {
  searchBox.value = "";
  selectedCategory = "All";
  searchBox.focus();
  renderCategories();
  render();
});
themeBtn.addEventListener("click", () => {
  darkMode = !darkMode;
  applyTheme();
});

document.addEventListener("keydown", (event) => {
  if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "f") {
    event.preventDefault();
    searchBox.focus();
    searchBox.select();
  }

  if (event.ctrlKey && /^[1-9]$/.test(event.key)) {
    event.preventDefault();
    const index = Number(event.key) - 1;
    const item = visibleResponses[index];
    if (item) copyText(item);
  }
});

applyTheme();
renderCategories();
render();
