const list = document.getElementById("responseList");
const searchBox = document.getElementById("searchBox");
const clearBtn = document.getElementById("clearBtn");
const statusBox = document.getElementById("status");

let visibleResponses = [];

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
    showStatus("Copy failed. Highlight the text and press Ctrl+C.");
  }
}

function render() {
  const query = searchBox.value.trim().toLowerCase();

  visibleResponses = window.RESPONSES.filter(item => {
    const combined = `${item.title} ${item.category} ${item.text}`.toLowerCase();
    return combined.includes(query);
  });

  list.innerHTML = "";

  if (visibleResponses.length === 0) {
    list.innerHTML = `<div class="card">No matching responses found.</div>`;
    return;
  }

  visibleResponses.forEach((item, index) => {
    const card = document.createElement("article");
    card.className = "card";

    const shortcut = index < 9 ? `<div class="shortcut">Shortcut: Ctrl + ${index + 1}</div>` : "";

    card.innerHTML = `
      <div class="card-top">
        <div>
          <h2 class="title">${item.title}</h2>
          <span class="category">${item.category}</span>
        </div>
        <button type="button">Copy</button>
      </div>
      <div class="preview">${escapeHtml(item.text)}</div>
      ${shortcut}
    `;

    card.querySelector("button").addEventListener("click", () => copyText(item));
    card.addEventListener("dblclick", () => copyText(item));
    list.appendChild(card);
  });
}

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

searchBox.addEventListener("input", render);
clearBtn.addEventListener("click", () => {
  searchBox.value = "";
  searchBox.focus();
  render();
});

document.addEventListener("keydown", (event) => {
  // Shortcut to focus search: Ctrl + Shift + F
  if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "f") {
    event.preventDefault();
    searchBox.focus();
    searchBox.select();
  }

  // Shortcuts to copy visible response 1-9: Ctrl + 1 through Ctrl + 9
  if (event.ctrlKey && /^[1-9]$/.test(event.key)) {
    event.preventDefault();
    const index = Number(event.key) - 1;
    const item = visibleResponses[index];
    if (item) copyText(item);
  }
});

render();
