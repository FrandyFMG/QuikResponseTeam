const grid = document.getElementById("responseGrid");
const searchBox = document.getElementById("searchBox");
const categoryFilter = document.getElementById("categoryFilter");
const clearSearch = document.getElementById("clearSearch");
const statusBox = document.getElementById("status");
const template = document.getElementById("cardTemplate");

function loadCategories() {
  const categories = [...new Set(RESPONSES.map(item => item.category))].sort();
  for (const category of categories) {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categoryFilter.appendChild(option);
  }
}

function copyText(text, title) {
  navigator.clipboard.writeText(text).then(() => {
    statusBox.textContent = `Copied: ${title}`;
    setTimeout(() => statusBox.textContent = "", 2500);
  }).catch(() => {
    statusBox.textContent = "Copy failed. Highlight the text manually and press Ctrl+C.";
  });
}

function renderResponses() {
  const query = searchBox.value.trim().toLowerCase();
  const category = categoryFilter.value;

  const filtered = RESPONSES.filter(item => {
    const matchesCategory = category === "all" || item.category === category;
    const haystack = `${item.title} ${item.category} ${item.description} ${item.text}`.toLowerCase();
    const matchesSearch = !query || haystack.includes(query);
    return matchesCategory && matchesSearch;
  });

  grid.innerHTML = "";

  if (filtered.length === 0) {
    statusBox.textContent = "No matching responses found.";
    return;
  }

  statusBox.textContent = `${filtered.length} response(s) available.`;

  for (const item of filtered) {
    const card = template.content.cloneNode(true);
    card.querySelector(".category").textContent = item.category;
    card.querySelector("h2").textContent = item.title;
    card.querySelector("p").textContent = item.description;
    card.querySelector("textarea").value = item.text;
    card.querySelector(".copyBtn").addEventListener("click", () => copyText(item.text, item.title));
    card.querySelector("textarea").addEventListener("click", event => event.target.select());
    grid.appendChild(card);
  }
}

searchBox.addEventListener("input", renderResponses);
categoryFilter.addEventListener("change", renderResponses);
clearSearch.addEventListener("click", () => {
  searchBox.value = "";
  categoryFilter.value = "all";
  renderResponses();
});

loadCategories();
renderResponses();
