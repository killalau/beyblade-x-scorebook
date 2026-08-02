import { scoreProduct } from "../src/scoring.js";

const excludedStatuses = new Set(["out_of_stock", "unavailable", "not_observed", "unknown"]);

export function listingIdFor(retailer, url) {
  const decodedUrl = safeDecode(url);
  const amazon = decodedUrl.match(/\/dp\/([A-Z0-9]{10})/i);
  if (amazon) return `amazon-ca:${amazon[1].toUpperCase()}`;
  const walmart = String(url).match(/\/([A-Z0-9]{12,})\/?(?:\?|$)/i);
  if (walmart) return `walmart-ca:${walmart[1].toUpperCase()}`;
  return `${slug(retailer || "listing")}:${slug(url)}`;
}

export function normalizeStatus(status) {
  const value = String(status || "").toLowerCase();
  if (value.includes("available now") || value.includes("already owned")) return "available_now";
  if (value.includes("preorder")) return "preorder";
  if (value.includes("restock") || value.includes("delivery")) return "delayed";
  if (value.includes("backorder")) return "backorder";
  if (value.includes("out of stock")) return "out_of_stock";
  if (value.includes("unavailable")) return "unavailable";
  if (value.includes("not observed")) return "not_observed";
  return "unknown";
}

export function isWishlistEligible(listing) {
  return listing.normalizationStatus === "verified" && listing.orderable !== false && !excludedStatuses.has(listing.availabilityStatus);
}

export function configsFromListing(item) {
  const source = item.includedBeys && item.includedBeys !== "-" ? item.includedBeys : item.configs;
  return String(source || item.name || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function generateWishlist(normalized, inventory) {
  const ownedParts = inventory.parts || [];
  const items = normalized.items.filter(isWishlistEligible).map((listing) => {
    const scored = scoreProduct({
      name: listing.name,
      configs: listing.configs,
      price: listing.price
    }, {
      ownedParts,
      cxMode: listing.cxMode === true
    });
    const useful = unique(scored.parts.filter((part) => part.partScore > 0 && part.rarity !== "owned"));
    const usefulParts = useful.length ? useful.map(formatRankedPart).join(", ") : "-";
    const hasRankedParts = scored.parts.some((part) => part.partScore > 0);
    const parts = unique(scored.parts).map((part) => ({
      name: part.name,
      type: part.type,
      owned: part.rarity === "owned",
      rankClass: part.rankClass,
      ...(part.type === "bit" && ["Tr", "Op"].includes(part.name) ? { fused: true } : {})
    }));
    const helpsInventory = useful.length
      ? `Adds: ${usefulParts}`
      : hasRankedParts
        ? "Fully overlaps owned ranked inventory"
        : "No ranked upgrade identified";
    return {
      listingId: listing.listingId,
      costIndex: scored.costIndex,
      score: scored.score,
      name: listing.name,
      price: listing.price,
      retailer: listing.retailer,
      status: listing.statusLabel,
      bundleType: listing.bundleType,
      includedBeys: listing.includedBeys,
      configs: listing.configs.join(", "),
      parts,
      usefulParts,
      helpsInventory,
      url: listing.url,
      notes: listing.notes,
      availabilityText: listing.availabilityText,
      ...(listing.imageUrl ? { imageUrl: listing.imageUrl } : {}),
      ...(listing.firstSeenAt ? { createdAt: listing.firstSeenAt } : {})
    };
  });
  return { currency: normalized.currency || "CAD", items };
}

export function compareWishlists(before, after) {
  const previous = new Map(before.items.map((item) => [item.listingId || listingIdFor(item.retailer, item.url), item]));
  const next = new Map(after.items.map((item) => [item.listingId, item]));
  const added = [...next.keys()].filter((key) => !previous.has(key));
  const removed = [...previous.keys()].filter((key) => !next.has(key));
  const changed = [...next.entries()].flatMap(([key, item]) => {
    const old = previous.get(key);
    if (!old) return [];
    const fields = ["score", "costIndex", "parts", "usefulParts", "helpsInventory"]
      .filter((field) => JSON.stringify(old[field]) !== JSON.stringify(item[field]));
    return fields.length ? [{ listingId: key, name: item.name, fields, before: pick(old, fields), after: pick(item, fields) }] : [];
  });
  return { added, removed, changed };
}

function formatRankedPart(part) {
  const detail = part.rankDetail && part.rankDetail !== "-" ? ` ${part.rankDetail}` : "";
  const source = part.rankSource && part.rankSource !== "-" ? ` (${part.rankSource}${detail})` : "";
  return `${part.displayName || part.name}${source}`;
}

function unique(parts) {
  const seen = new Set();
  return parts.filter((part) => {
    const key = `${part.type}:${part.name}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function pick(value, fields) {
  return Object.fromEntries(fields.map((field) => [field, value[field]]));
}

function slug(value) {
  return String(value || "unknown").toLowerCase().replace(/^https?:\/\//, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function safeDecode(value) {
  try {
    return decodeURIComponent(String(value || ""));
  } catch {
    return String(value || "");
  }
}
