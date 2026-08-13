import { listingIdFor, normalizeStatus } from "./wishlist-pipeline.mjs";

export function extractObservations(raw, sourceFile = "unknown") {
  if (Array.isArray(raw)) return raw.flatMap((item) => observationFromDetail(item, sourceFile));
  const observations = [];
  if (Array.isArray(raw.normalizedListings)) {
    observations.push(...raw.normalizedListings.map((item) => observation(item, raw.retailer || "Amazon.ca", raw.collectedAt, sourceFile)));
  }
  for (const source of raw.sources || []) {
    observations.push(...(source.verifiedListings || []).map((item) => observation(item, source.retailer, raw.collectedAt, sourceFile)));
  }
  for (const item of raw.products || []) {
    const retailer = item.retailer || (item.asin ? "Amazon.ca" : "Walmart.ca");
    observations.push(observation(item, retailer, item.scrapedAt || raw.collectedAt, sourceFile, false));
  }
  return observations.filter((item) => item.listingId && item.url);
}

export function mergeObservations(catalogue, observations) {
  const items = catalogue.items.map((item) => canonicalizeExisting({ ...item }));
  const byId = new Map(items.map((item) => [item.listingId, item]));
  const report = { updated: [], unchanged: [], candidates: [], stale: [] };
  for (const currentObservation of newestByListing(observations)) {
    const existing = byId.get(currentObservation.listingId);
    if (!existing) {
      report.candidates.push(currentObservation);
      continue;
    }
    if (!isNewer(currentObservation.observedAt, existing.lastSeenAt)) {
      report.stale.push({ listingId: existing.listingId, observedAt: currentObservation.observedAt, lastSeenAt: existing.lastSeenAt });
      continue;
    }
    const before = JSON.stringify(existing);
    existing.lastSeenAt = currentObservation.observedAt || existing.lastSeenAt;
    if (currentObservation.price !== undefined) existing.price = currentObservation.price;
    if (currentObservation.availabilityText) existing.availabilityText = currentObservation.availabilityText;
    if (currentObservation.verified && currentObservation.url && !/\/sspa\/click/i.test(currentObservation.url)) existing.url = currentObservation.url;
    if (currentObservation.imageUrl) existing.imageUrl = currentObservation.imageUrl;
    if (currentObservation.verified && currentObservation.availabilityStatus !== "unknown") {
      existing.availabilityStatus = currentObservation.availabilityStatus;
      existing.statusLabel = currentObservation.statusLabel;
      existing.orderable = currentObservation.orderable;
      if (currentObservation.orderable) existing.lastAvailableAt = currentObservation.observedAt || existing.lastAvailableAt;
    }
    if (JSON.stringify(existing) === before) report.unchanged.push(existing.listingId);
    else report.updated.push(existing.listingId);
  }
  return { catalogue: { ...catalogue, items }, report };
}

function canonicalizeExisting(item) {
  if (item.listingId?.startsWith("amazon-ca:") && /amazon\.ca\/sspa\/click/i.test(item.url)) {
    item.url = `https://www.amazon.ca/dp/${item.listingId.split(":")[1]}`;
  }
  return item;
}

function observationFromDetail(item, sourceFile) {
  if (!item.asin || !(item.pageUrl || item.sourceUrl)) return [];
  return [observation({
    ...item,
    rawTitle: item.title || item.candidateTitle,
    sourceUrl: item.pageUrl || item.sourceUrl,
    rawPriceText: item.priceCad,
    availabilityText: item.availability,
    availabilityStatus: item.inStockSignal ? "available_now" : "unknown"
  }, "Amazon.ca", item.collectedAt, sourceFile, true)];
}

function observation(item, retailer, observedAt, sourceFile, verified = true) {
  const url = item.sourceUrl || item.pageUrl || item.productUrl || item.href || "";
  const availabilityText = item.availabilityText || item.availability || item.fulfillmentText || item.status || "";
  const availabilityStatus = statusFromText(availabilityText, observedAt, item.availabilityStatus);
  return {
    listingId: listingIdFor(retailer, url),
    retailer,
    productId: item.asin || item.productId || null,
    name: item.rawTitle || item.title || item.name || item.candidateTitle || "",
    price: priceFrom(item.priceCad ?? item.rawPriceText ?? item.priceText),
    url,
    imageUrl: item.imageUrl,
    availabilityText,
    availabilityStatus,
    statusLabel: statusLabel(availabilityStatus, availabilityText),
    orderable: ["available_now", "preorder", "delayed", "backorder"].includes(availabilityStatus),
    observedAt: observedAt || null,
    verified,
    sourceFile
  };
}

function statusFromText(value, observedAt, explicitStatus) {
  const text = String(value || "").toLowerCase();
  if (/temporarily out of stock|no current buying option|unavailable/.test(text)) return "unavailable";
  if (/back.?order|email you when/.test(text)) return "backorder";
  if (/pre.?order/.test(text)) return "preorder";
  const baseStatus = explicitStatus || (/delivery|in stock|add to cart|add button/.test(text) ? "available_now" : normalizeStatus(value));
  if (baseStatus === "available_now" && deliveryIsAfterSevenDays(value, observedAt)) return "delayed";
  return baseStatus;
}

function deliveryIsAfterSevenDays(value, observedAt) {
  if (/pickup,?\s*today|as soon as\s+\d+\s+hour/i.test(String(value || ""))) return false;
  const observed = new Date(observedAt);
  if (!Number.isFinite(observed.getTime())) return false;
  const monthNumbers = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
  const dates = [...String(value || "").matchAll(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2})\b/gi)]
    .map((match) => {
      let year = observed.getFullYear();
      const month = monthNumbers[match[1].slice(0, 3).toLowerCase()];
      if (month < observed.getMonth() - 6) year += 1;
      return new Date(year, month, Number(match[2]), 23, 59, 59);
    });
  if (!dates.length) return false;
  const cutoff = new Date(observed);
  cutoff.setDate(cutoff.getDate() + 7);
  cutoff.setHours(23, 59, 59, 999);
  return dates.every((date) => date > cutoff);
}

function statusLabel(status, raw) {
  if (status === "available_now") return "Available now";
  if (status === "preorder") return "Preorder";
  if (status === "backorder") return "Backorder - date unknown";
  if (status === "delayed") return "Delayed delivery";
  if (status === "unavailable") return "Unavailable";
  if (status === "out_of_stock") return "Out of stock";
  return raw || "Unknown";
}

function priceFrom(value) {
  if (value === null || value === undefined || value === "") return undefined;
  const numeric = Number(String(value).replace(/[^0-9.]/g, ""));
  return Number.isFinite(numeric) ? numeric : undefined;
}

function newestByListing(observations) {
  const newest = new Map();
  for (const item of observations) {
    const existing = newest.get(item.listingId);
    if (!existing || isNewer(item.observedAt, existing.observedAt)) newest.set(item.listingId, item);
  }
  return newest.values();
}

function isNewer(candidate, current) {
  const candidateTime = Date.parse(candidate);
  const currentTime = Date.parse(current);
  if (!Number.isFinite(candidateTime)) return false;
  return !Number.isFinite(currentTime) || candidateTime > currentTime;
}
