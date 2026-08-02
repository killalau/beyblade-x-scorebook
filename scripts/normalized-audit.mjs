import { fusedBitCodes } from "../src/reference-data/names.js";

const suspiciousPatterns = [
  /\bcompatible\b/i,
  /\bSB Brand\b/i,
  /\bGfive\b/i,
  /\bCunjxtan\b/i,
  /\bT-Shirt\b/i,
  /Beyblade Burst/i,
  /Spinning Toy Kit/i
];

export function auditNormalized(data) {
  const issues = [];
  const seen = new Set();
  for (const item of data.items || []) {
    const add = (code, detail) => issues.push({ code, listingId: item.listingId, name: item.name, detail });
    if (seen.has(item.listingId)) add("duplicate_listing_id", item.listingId);
    seen.add(item.listingId);
    if (item.normalizationStatus !== "verified") add("needs_review", item.normalizationStatus || "missing normalizationStatus");
    if (!item.productId) add("missing_product_id", "No retailer product ID");
    if (!item.firstSeenAt) add("missing_first_seen", "Historical first-seen time is unknown");
    if (!item.lastSeenAt) add("missing_last_seen", "No verified observation timestamp");
    if (!item.imageUrl) add("missing_image", "No reliable product image");
    if (item.availabilityStatus === "unknown") add("unknown_availability", item.statusLabel || "No status label");
    if (/amazon\.ca\/sspa\/click/i.test(item.url)) add("noncanonical_url", "Amazon sponsored redirect URL");
    if (isBeyProduct(item) && !(item.configs || []).some(hasConfig)) add("incomplete_configs", (item.configs || []).join(", ") || "No configs");
    if (suspiciousPatterns.some((pattern) => pattern.test(item.name))) add("suspicious_listing", "Possible third-party, irrelevant, or non-Beyblade X product");
  }
  return {
    total: data.items?.length || 0,
    issueCount: issues.length,
    counts: Object.fromEntries([...new Set(issues.map((issue) => issue.code))].sort().map((code) => [code, issues.filter((issue) => issue.code === code).length])),
    issues
  };
}

function hasConfig(value) {
  const config = String(value);
  const fusedCode = config.split(/\s+/).at(-1);
  return /\b(?:[A-Z]{0,3})?\d-\d{2}[A-Z]{1,3}\b/.test(config)
    || (/^.+\s+[^\s]+\s+[A-Z]\s+[^\s]+$/i.test(config)
      && Object.keys(fusedBitCodes).some((code) => code.toLowerCase() === fusedCode?.toLowerCase()));
}

function isBeyProduct(item) {
  return !/stadium|arena|launcher|grip|case|connector|shirt|parts|expansion/i.test(`${item.name} ${item.bundleType || ""}`);
}
