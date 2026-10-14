export function normalizeInventoryProductName(value) {
  return String(value ?? "")
    .replace(/\s*\(x\d+\)\s*$/i, "")
    .toLowerCase()
    .replace(/\b(starter|pack|set|dual|deluxe|with launcher)\b/g, " ")
    .replace(/[^a-z0-9]+/g, "");
}

export function findPurchaseForInventoryBey(purchases, bey) {
  const exactMatches = purchases.filter((purchase) => purchase.name === bey);
  if (exactMatches.length) return preferredOwnedPurchase(exactMatches);

  const normalizedBey = normalizeInventoryProductName(bey);
  const fuzzyMatches = purchases.filter((purchase) => {
    const normalizedPurchase = normalizeInventoryProductName(purchase.name);
    return normalizedPurchase.includes(normalizedBey) || normalizedBey.includes(normalizedPurchase);
  });
  return preferredOwnedPurchase(fuzzyMatches);
}

function preferredOwnedPurchase(purchases) {
  return purchases.find(hasRemainingPurchasedItems) ?? purchases[0];
}

function hasRemainingPurchasedItems(purchase) {
  const quantity = positiveNumberOrDefault(purchase?.quantity, 1);
  const disposed = [purchase?.soldItems, purchase?.returnedItems, purchase?.giftedItems]
    .reduce((total, items) => total + (Array.isArray(items) ? items.length : 0), 0);
  return quantity > disposed;
}

function positiveNumberOrDefault(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}
