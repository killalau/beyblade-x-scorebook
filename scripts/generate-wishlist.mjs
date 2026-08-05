import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { compareWishlists, generateWishlist } from "./wishlist-pipeline.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const normalizedPath = `${root}/data/normalized/retailer-listings.local.json`;
const collectionPath = `${root}/data/collection.local.json`;
const wishlistPath = `${root}/data/wishlist.local.json`;
const dryRun = process.argv.includes("--dry-run");
const verbose = process.argv.includes("--verbose");

const [normalized, collection, previous] = await Promise.all([
  readJson(normalizedPath),
  readJson(collectionPath),
  readJson(wishlistPath)
]);
const next = generateWishlist(normalized, collection.inventory);
const report = compareWishlists(previous, next);

console.log(JSON.stringify({
  mode: dryRun ? "dry-run" : "write",
  normalized: normalized.items.length,
  eligible: next.items.length,
  excluded: normalized.items.length - next.items.length,
  added: report.added.length,
  removed: report.removed.length,
  changed: report.changed.length,
  ...(verbose ? { changes: report.changed } : {})
}, null, 2));

if (!dryRun) {
  await writeFile(wishlistPath, `${JSON.stringify(next, null, 2)}\n`);
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}
