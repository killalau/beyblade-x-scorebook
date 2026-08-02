import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { isWishlistEligible } from "./wishlist-pipeline.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));

const inventory = readOptionalJson("data/inventory.local.json");
const purchases = readOptionalJson("data/purchases.local.json");
const wishlist = readOptionalJson("data/wishlist.local.json");
const normalized = readOptionalJson("data/normalized/retailer-listings.local.json");
const rawFiles = listOptionalRawFiles("data/raw");

console.log(JSON.stringify({
  inventory: inventory ? {
    parts: inventory.parts?.length ?? 0,
    beys: inventory.beys?.length ?? 0,
    partsDetail: inventory.partsDetail?.length ?? 0
  } : null,
  purchases: purchases ? {
    items: purchases.items?.length ?? 0,
    currency: purchases.currency ?? null,
    taxRegion: purchases.taxRegion ?? null
  } : null,
  wishlist: wishlist ? {
    items: wishlist.items?.length ?? 0,
    currency: wishlist.currency ?? null
  } : null,
  normalizedListings: normalized ? {
    items: normalized.items?.length ?? 0,
    eligible: normalized.items?.filter(isWishlistEligible).length ?? 0,
    excluded: normalized.items?.filter((item) => !isWishlistEligible(item)).length ?? 0
  } : null,
  rawFiles
}, null, 2));

function readOptionalJson(relativePath) {
  const path = join(root, relativePath);
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf8"));
}

function listOptionalRawFiles(relativePath) {
  const path = join(root, relativePath);
  if (!existsSync(path)) return [];
  return listJsonFiles(path).map((file) => file.replace(root, ""));
}

function listJsonFiles(path) {
  const stats = statSync(path);
  if (stats.isFile()) return path.endsWith(".json") ? [path] : [];
  return readdirSync(path).flatMap((entry) => listJsonFiles(join(path, entry)));
}
