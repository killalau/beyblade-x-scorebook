export function matchesPartFilters(item, { requestedParts = [], partType = "", matchAll = false, onlyMissing = false } = {}) {
  const parts = Array.isArray(item.parts) ? item.parts : [];
  const eligibleParts = parts.filter((part) => (!partType || part.type === partType) && (!onlyMissing || part.owned !== true));
  if (requestedParts.length) {
    const names = new Set(eligibleParts.map((part) => String(part.name || "").toLowerCase()));
    const matches = requestedParts.map((part) => names.has(String(part).toLowerCase()));
    return matchAll ? matches.every(Boolean) : matches.some(Boolean);
  }
  if (partType || onlyMissing) return eligibleParts.length > 0;
  return true;
}

export function partFilterTokens(value) {
  return [...new Set(String(value || "").split(",").map((part) => part.trim().toLowerCase()).filter(Boolean))];
}
