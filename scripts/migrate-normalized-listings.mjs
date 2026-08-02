import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { configsFromListing, listingIdFor, normalizeStatus } from "./wishlist-pipeline.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const wishlistPath = `${root}/data/wishlist.local.json`;
const outputPath = `${root}/data/normalized/retailer-listings.local.json`;
const wishlist = JSON.parse(await readFile(wishlistPath, "utf8"));
const existing = await readExisting(outputPath);
const existingById = new Map((existing?.items || []).map((item) => [item.listingId, item]));

const migrated = wishlist.items.map((item) => {
  const availabilityStatus = normalizeStatus(item.status);
  const configs = configsFromListing(item);
  const listingId = listingIdFor(item.retailer, item.url);
  const previous = existingById.get(listingId);
  return {
    listingId,
    retailer: item.retailer,
    productId: productId(item.retailer, item.url),
    name: item.name,
    price: item.price,
    currency: wishlist.currency || "CAD",
    statusLabel: item.status,
    availabilityStatus,
    orderable: !["out_of_stock", "unavailable", "not_observed", "unknown"].includes(availabilityStatus),
    bundleType: item.bundleType,
    includedBeys: item.includedBeys,
    configs,
    cxMode: configs.some((config) => /\b[A-Z]{1,3}\d-\d{2}[A-Z]/.test(config)),
    url: item.url,
    imageUrl: item.imageUrl,
    availabilityText: item.availabilityText,
    notes: item.notes,
    firstSeenAt: item.createdAt || previous?.firstSeenAt || null,
    lastSeenAt: previous?.lastSeenAt || item.createdAt || null,
    ...(previous?.lastAvailableAt ? { lastAvailableAt: previous.lastAvailableAt } : {}),
    normalizationStatus: "verified"
  };
});
const migratedIds = new Set(migrated.map((item) => item.listingId));
const normalizedOnly = (existing?.items || []).filter((item) => !migratedIds.has(item.listingId));
const items = [...migrated, ...normalizedOnly];

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify({ currency: wishlist.currency || "CAD", items }, null, 2)}\n`);
console.log(`Migrated ${items.length} normalized retailer listings to data/normalized/retailer-listings.local.json`);

function productId(retailer, url) {
  const id = listingIdFor(retailer, url).split(":").at(-1);
  return id || null;
}

async function readExisting(path) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}
