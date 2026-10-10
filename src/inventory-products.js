export function normalizeInventoryProductName(value) {
  return String(value ?? "")
    .replace(/\s*\(x\d+\)\s*$/i, "")
    .toLowerCase()
    .replace(/\b(starter|pack|set|dual|deluxe|with launcher)\b/g, " ")
    .replace(/[^a-z0-9]+/g, "");
}

export function findPurchaseForInventoryBey(purchases, bey) {
  const exact = purchases.find((purchase) => purchase.name === bey);
  if (exact) return exact;

  const normalizedBey = normalizeInventoryProductName(bey);
  return purchases.find((purchase) => {
    const normalizedPurchase = normalizeInventoryProductName(purchase.name);
    return normalizedPurchase.includes(normalizedBey) || normalizedBey.includes(normalizedPurchase);
  });
}
