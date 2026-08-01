import { sampleProducts } from "./reference-data/index.js";
import {
  partTypeWeights,
  rankScores,
  rarityMultipliers
} from "./reference-data/scoringConfig.js";
import { scoreProduct, summarizeBreakdown } from "./scoring.js";

const storageKeys = {
  inventory: "beybladeScorebook.inventory",
  wishlist: "beybladeScorebook.wishlist"
};

const state = {
  ownedParts: [],
  ownedBeys: [],
  inventoryDetail: [],
  wishlistItems: [],
  selectedResultIndex: 0,
  results: [],
  rows: [
    { text: "Gill Shark 4-70O, Pearl Tiger 3-60U", price: "22.98", cxMode: false },
    { text: "Rage Ragna FE4-55Y", price: "19.99", cxMode: true }
  ]
};

const elements = {
  form: document.querySelector("#lookupForm"),
  tabs: [...document.querySelectorAll(".tab-button")],
  pages: {
    scorebook: document.querySelector("#scorebookPage"),
    inventory: document.querySelector("#inventoryPage"),
    wishlist: document.querySelector("#wishlistPage"),
    rules: document.querySelector("#rulesPage")
  },
  addProductRow: document.querySelector("#addProductRow"),
  productRows: document.querySelector("#productRows"),
  rareParts: document.querySelector("#rareParts"),
  score: document.querySelector("#scoreValue"),
  costIndex: document.querySelector("#costIndexValue"),
  inventory: document.querySelector("#inventoryValue"),
  breakdownBody: document.querySelector("#breakdownBody"),
  partCount: document.querySelector("#partCount"),
  productCount: document.querySelector("#productCount"),
  productResults: document.querySelector("#productResults"),
  sampleList: document.querySelector("#sampleList"),
  clearLocalData: document.querySelector("#clearLocalData"),
  inventoryFile: document.querySelector("#inventoryFile"),
  wishlistFile: document.querySelector("#wishlistFile"),
  inventoryLoadStatus: document.querySelector("#inventoryLoadStatus"),
  wishlistLoadStatus: document.querySelector("#wishlistLoadStatus"),
  dataErrorStatus: document.querySelector("#dataErrorStatus"),
  inventorySummary: document.querySelector("#inventorySummary"),
  inventoryPartSummary: document.querySelector("#inventoryPartSummary"),
  inventoryBeys: document.querySelector("#inventoryBeys"),
  inventoryPartsBody: document.querySelector("#inventoryPartsBody"),
  wishlistSummary: document.querySelector("#wishlistSummary"),
  wishlistSearch: document.querySelector("#wishlistSearch"),
  wishlistSort: document.querySelector("#wishlistSort"),
  wishlistItems: document.querySelector("#wishlistItems"),
  rankScoreRules: document.querySelector("#rankScoreRules"),
  partWeightRules: document.querySelector("#partWeightRules"),
  rarityRules: document.querySelector("#rarityRules")
};

elements.tabs.forEach((tab) => {
  tab.addEventListener("click", () => showPage(tab.dataset.page));
});

elements.addProductRow.addEventListener("click", () => {
  state.rows.push({ text: "", price: "", cxMode: false });
  state.selectedResultIndex = state.rows.length - 1;
  renderProductEditor();
  calculateCurrent();
});

elements.form.addEventListener("submit", (event) => {
  event.preventDefault();
  calculateCurrent();
});

elements.inventoryFile.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  await loadInventoryFile(file);
});

elements.wishlistFile.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  await loadWishlistFile(file);
});

elements.clearLocalData.addEventListener("click", () => {
  localStorage.removeItem(storageKeys.inventory);
  localStorage.removeItem(storageKeys.wishlist);
  applyInventoryData({ parts: [], beys: [], partsDetail: [] });
  applyWishlistData({ items: [] });
  elements.inventoryLoadStatus.textContent = "Inventory: not loaded";
  elements.wishlistLoadStatus.textContent = "Wishlist: not loaded";
  clearDataError();
  calculateCurrent();
});

elements.wishlistSearch.addEventListener("input", renderWishlist);
elements.wishlistSort.addEventListener("change", renderWishlist);

function showPage(pageName) {
  for (const [name, page] of Object.entries(elements.pages)) {
    page.classList.toggle("active-page", name === pageName);
  }
  elements.tabs.forEach((tab) => {
    tab.classList.toggle("selected", tab.dataset.page === pageName);
  });
}

async function loadInventoryFile(file) {
  try {
    const data = JSON.parse(await file.text());
    validateInventoryData(data);
    applyInventoryData(data);
    saveLocalData(storageKeys.inventory, file.name, data);
    elements.inventoryLoadStatus.textContent = `Inventory: ${file.name} at ${formatTimestamp(new Date())}`;
    clearDataError();
    calculateCurrent();
  } catch (error) {
    showDataError(`Inventory error: ${error.message}`);
  }
}

async function loadWishlistFile(file) {
  try {
    const data = JSON.parse(await file.text());
    validateWishlistData(data);
    applyWishlistData(data);
    saveLocalData(storageKeys.wishlist, file.name, data);
    elements.wishlistLoadStatus.textContent = `Wishlist: ${file.name} at ${formatTimestamp(new Date())}`;
    clearDataError();
  } catch (error) {
    showDataError(`Wishlist error: ${error.message}`);
  }
}

function applyInventoryData(data) {
  state.ownedParts = data.parts;
  state.ownedBeys = data.beys;
  state.inventoryDetail = Array.isArray(data.partsDetail) ? data.partsDetail : [];
  elements.inventory.textContent = `${state.ownedParts.length} parts`;
  renderInventory();
}

function applyWishlistData(data) {
  state.wishlistItems = data.items;
  renderWishlist();
}

function loadSavedLocalData() {
  const savedInventory = readLocalData(storageKeys.inventory);
  if (savedInventory) {
    try {
      validateInventoryData(savedInventory.data);
      applyInventoryData(savedInventory.data);
      elements.inventoryLoadStatus.textContent = `Inventory: ${savedInventory.fileName} at ${savedInventory.savedAt}`;
    } catch {
      localStorage.removeItem(storageKeys.inventory);
    }
  }

  const savedWishlist = readLocalData(storageKeys.wishlist);
  if (savedWishlist) {
    try {
      validateWishlistData(savedWishlist.data);
      applyWishlistData(savedWishlist.data);
      elements.wishlistLoadStatus.textContent = `Wishlist: ${savedWishlist.fileName} at ${savedWishlist.savedAt}`;
    } catch {
      localStorage.removeItem(storageKeys.wishlist);
    }
  }
}

function saveLocalData(key, fileName, data) {
  localStorage.setItem(key, JSON.stringify({
    fileName,
    savedAt: formatTimestamp(new Date()),
    data
  }));
}

function readLocalData(key) {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}

function validateInventoryData(data) {
  if (!data || typeof data !== "object") throw new Error("JSON must be an object.");
  if (!Array.isArray(data.parts)) throw new Error("Expected a parts array.");
  if (!Array.isArray(data.beys)) throw new Error("Expected a beys array.");
}

function validateWishlistData(data) {
  if (!data || typeof data !== "object") throw new Error("JSON must be an object.");
  if (!Array.isArray(data.items)) throw new Error("Expected an items array.");
}

function showDataError(message) {
  elements.dataErrorStatus.textContent = message;
}

function clearDataError() {
  elements.dataErrorStatus.textContent = "";
}

function renderRules() {
  renderRuleList(elements.rankScoreRules, rankScores);
  renderRuleList(elements.partWeightRules, partTypeWeights);
  renderRuleList(elements.rarityRules, rarityMultipliers);
}

function renderRuleList(target, rules) {
  const items = Object.entries(rules).map(([label, value]) => {
    const item = document.createElement("div");
    item.className = "rule-item";
    item.innerHTML = `<span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong>`;
    return item;
  });
  target.replaceChildren(...items);
}

function renderSamples() {
  elements.sampleList.replaceChildren(
    ...sampleProducts.map((product) => {
      const result = scoreProduct(product, state);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "sample-item";
      button.innerHTML = `
        <span>${product.name}</span>
        <strong>${formatScore(result.score)} / ${formatCostIndex(result.costIndex)}</strong>
      `;
      button.addEventListener("click", () => {
        state.rows = [{
          text: product.configs.join(", "),
          price: product.price ?? "",
          cxMode: product.cx === true
        }];
        state.selectedResultIndex = 0;
        renderProductEditor();
        calculateCurrent();
      });
      return button;
    })
  );
}

function calculateCurrent() {
  const rareParts = elements.rareParts.value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  syncRowsFromDom();
  const products = state.rows.filter((row) => row.text.trim());
  state.results = products.map((row) => scoreProduct(
    {
      name: row.text,
      configs: row.text.split(",").map((config) => config.trim()).filter(Boolean),
      price: row.price
    },
    { ownedParts: state.ownedParts, rareParts, cxMode: row.cxMode }
  ));
  if (state.selectedResultIndex >= state.results.length) {
    state.selectedResultIndex = 0;
  }
  renderProductResults();
  renderResult(state.results[state.selectedResultIndex]);
  renderSamples();
}

function renderProductEditor() {
  const rows = state.rows.map((row, index) => {
    const wrapper = document.createElement("div");
    wrapper.className = "editor-row";
    wrapper.dataset.index = String(index);
    wrapper.innerHTML = `
      <input class="product-input" type="text" value="${escapeHtml(row.text)}" placeholder="Product or combo">
      <input class="price-input" type="number" min="0" step="0.01" value="${escapeHtml(row.price)}" placeholder="Price">
      <label class="cx-toggle row-toggle">
        <input class="cx-input" type="checkbox" ${row.cxMode ? "checked" : ""}>
        <span>CX</span>
      </label>
      <button class="remove-row" type="button" aria-label="Remove row">x</button>
    `;
    wrapper.querySelector(".product-input").addEventListener("input", () => calculateCurrent());
    wrapper.querySelector(".price-input").addEventListener("input", () => calculateCurrent());
    wrapper.querySelector(".cx-input").addEventListener("change", () => calculateCurrent());
    wrapper.querySelector(".remove-row").addEventListener("click", () => {
      if (state.rows.length === 1) {
        state.rows = [{ text: "", price: "", cxMode: false }];
      } else {
        state.rows.splice(index, 1);
      }
      if (state.selectedResultIndex >= state.rows.length) {
        state.selectedResultIndex = Math.max(0, state.rows.length - 1);
      }
      renderProductEditor();
      calculateCurrent();
    });
    return wrapper;
  });
  elements.productRows.replaceChildren(...rows);
}

function renderInventory() {
  elements.inventorySummary.textContent = `${state.ownedBeys.length} beys`;
  elements.inventoryPartSummary.textContent = `${state.ownedParts.length} parts`;

  const beyItems = state.ownedBeys.map((bey) => {
    const item = document.createElement("div");
    item.className = "data-item";
    item.textContent = bey;
    return item;
  });
  elements.inventoryBeys.replaceChildren(...beyItems);

  const partRows = state.inventoryDetail.map((part) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${escapeHtml(part.category ?? "-")}</td>
      <td>${escapeHtml(part.name ?? "-")}</td>
      <td>${escapeHtml(part.abbrev ?? "-")}</td>
      <td>${escapeHtml(part.qty ?? "-")}</td>
      <td>${escapeHtml(part.source ?? "-")}</td>
      <td>${escapeHtml(part.notes ?? "-")}</td>
    `;
    return row;
  });
  elements.inventoryPartsBody.replaceChildren(...partRows);
}

function renderWishlist() {
  const query = elements.wishlistSearch.value.trim().toLowerCase();
  const sortKey = elements.wishlistSort.value;
  const filtered = state.wishlistItems
    .filter((item) => !query || JSON.stringify(item).toLowerCase().includes(query))
    .sort((a, b) => compareWishlistItems(a, b, sortKey));

  elements.wishlistSummary.textContent = `${filtered.length} of ${state.wishlistItems.length} items`;
  const cards = filtered.map((item) => {
    const card = document.createElement(item.url ? "a" : "div");
    card.className = "wishlist-item";
    if (item.url) {
      card.href = item.url;
      card.target = "_blank";
      card.rel = "noreferrer";
    }
    card.innerHTML = `
      <span>${escapeHtml(item.name ?? "-")}</span>
      <small class="wishlist-price">${formatPrice(item.price)}</small>
      <strong>${formatCostIndex(toNumber(item.costIndex))} CI / ${formatScore(toNumber(item.score))} score</strong>
      <small class="wishlist-meta">${escapeHtml(item.retailer ?? "-")} · ${escapeHtml(item.status ?? "-")}</small>
      <em>${escapeHtml(item.usefulParts ?? "-")}</em>
    `;
    return card;
  });
  elements.wishlistItems.replaceChildren(...cards);
}

function renderResult(result) {
  if (!result) {
    elements.score.textContent = "-";
    elements.costIndex.textContent = "-";
    elements.partCount.textContent = "0 parts";
    elements.breakdownBody.replaceChildren();
    return;
  }

  elements.score.textContent = formatScore(result.score);
  elements.costIndex.textContent = formatCostIndex(result.costIndex);
  elements.partCount.textContent = `${result.parts.length} parts`;

  const rows = summarizeBreakdown(result).map((part) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${escapeHtml(part.part)}</td>
      <td>${escapeHtml(labelType(part.type))}</td>
      <td>${escapeHtml(part.rank)}</td>
      <td>${formatScore(part.score)}</td>
      <td>${escapeHtml(part.rarity)}</td>
      <td>${formatScore(part.costContribution)}</td>
      <td>${escapeHtml(part.source)}</td>
    `;
    return row;
  });
  elements.breakdownBody.replaceChildren(...rows);
}

function renderProductResults() {
  elements.productCount.textContent = `${state.results.length} products`;
  const items = state.results.map((result, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = index === state.selectedResultIndex ? "product-row selected" : "product-row";
    button.innerHTML = `
      <span>${escapeHtml(result.name)}</span>
      <strong>${formatScore(result.score)} / ${formatCostIndex(result.costIndex)}</strong>
    `;
    button.addEventListener("click", () => {
      state.selectedResultIndex = index;
      renderProductResults();
      renderResult(result);
    });
    return button;
  });
  elements.productResults.replaceChildren(...items);
}

function syncRowsFromDom() {
  const renderedRows = [...elements.productRows.querySelectorAll(".editor-row")];
  if (!renderedRows.length) return;
  state.rows = renderedRows.map((row) => ({
    text: row.querySelector(".product-input").value,
    price: row.querySelector(".price-input").value,
    cxMode: row.querySelector(".cx-input").checked
  }));
}

function labelType(type) {
  return {
    blade: "Blade",
    ratchet: "Ratchet",
    bit: "Bit",
    lockChip: "Lock chip",
    overBlade: "Over blade",
    assistBlade: "Assist blade"
  }[type] || type;
}

function formatScore(value) {
  return Number.isFinite(value) ? String(value) : "-";
}

function formatCostIndex(value) {
  return Number.isFinite(value) ? `$${value}` : "-";
}

function formatTimestamp(date) {
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatPrice(value) {
  const numeric = toNumber(value);
  return Number.isFinite(numeric) ? `$${numeric}` : "-";
}

function toNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function compareWishlistItems(a, b, sortKey) {
  if (sortKey === "name") return String(a.name ?? "").localeCompare(String(b.name ?? ""));
  const aValue = toNumber(a[sortKey]);
  const bValue = toNumber(b[sortKey]);
  if (sortKey === "score") return (bValue ?? -Infinity) - (aValue ?? -Infinity);
  return sortablePositiveValue(aValue) - sortablePositiveValue(bValue);
}

function sortablePositiveValue(value) {
  return Number.isFinite(value) && value > 0 ? value : Infinity;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

renderSamples();
renderProductEditor();
renderRules();
loadSavedLocalData();
renderInventory();
renderWishlist();
calculateCurrent();
