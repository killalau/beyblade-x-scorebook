import { sampleProducts } from "./reference-data.js";
import { scoreProduct, summarizeBreakdown } from "./scoring.js";

const state = {
  ownedParts: [],
  ownedBeys: [],
  selectedResultIndex: 0,
  results: []
};

const elements = {
  form: document.querySelector("#lookupForm"),
  query: document.querySelector("#query"),
  cxMode: document.querySelector("#cxMode"),
  price: document.querySelector("#price"),
  rareParts: document.querySelector("#rareParts"),
  score: document.querySelector("#scoreValue"),
  costIndex: document.querySelector("#costIndexValue"),
  inventory: document.querySelector("#inventoryValue"),
  breakdownBody: document.querySelector("#breakdownBody"),
  partCount: document.querySelector("#partCount"),
  productCount: document.querySelector("#productCount"),
  productResults: document.querySelector("#productResults"),
  sampleList: document.querySelector("#sampleList"),
  inventoryFile: document.querySelector("#inventoryFile")
};

elements.form.addEventListener("submit", (event) => {
  event.preventDefault();
  calculateCurrent();
});

elements.inventoryFile.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  const data = JSON.parse(await file.text());
  state.ownedParts = Array.isArray(data.parts) ? data.parts : [];
  state.ownedBeys = Array.isArray(data.beys) ? data.beys : [];
  elements.inventory.textContent = `${state.ownedParts.length} parts`;
  calculateCurrent();
});

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
        elements.query.value = product.configs.join(", ");
        elements.price.value = product.price ?? "";
        elements.cxMode.checked = product.cx === true;
        state.selectedResultIndex = 0;
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
  const products = parseInputProducts(elements.query.value);
  state.results = products.map((line) => scoreProduct(
    {
      name: line,
      configs: line.split(",").map((config) => config.trim()).filter(Boolean),
      price: elements.price.value
    },
    { ownedParts: state.ownedParts, rareParts, cxMode: elements.cxMode.checked }
  ));
  if (state.selectedResultIndex >= state.results.length) {
    state.selectedResultIndex = 0;
  }
  renderProductResults();
  renderResult(state.results[state.selectedResultIndex]);
  renderSamples();
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

function parseInputProducts(value) {
  return String(value || "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
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

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

renderSamples();
calculateCurrent();
