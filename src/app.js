import { sampleProducts } from "./reference-data.js";
import { scoreProduct, summarizeBreakdown } from "./scoring.js";

const state = {
  ownedParts: [],
  ownedBeys: []
};

const elements = {
  form: document.querySelector("#lookupForm"),
  query: document.querySelector("#query"),
  price: document.querySelector("#price"),
  rareParts: document.querySelector("#rareParts"),
  score: document.querySelector("#scoreValue"),
  costIndex: document.querySelector("#costIndexValue"),
  inventory: document.querySelector("#inventoryValue"),
  breakdownBody: document.querySelector("#breakdownBody"),
  partCount: document.querySelector("#partCount"),
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
  const result = scoreProduct(
    {
      name: elements.query.value,
      configs: elements.query.value.split(",").map((config) => config.trim()).filter(Boolean),
      price: elements.price.value
    },
    { ownedParts: state.ownedParts, rareParts }
  );
  renderResult(result);
  renderSamples();
}

function renderResult(result) {
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
