import { readdir, readFile, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import { extractObservations, mergeObservations } from "./crawl-normalizer.mjs";
import { auditNormalized } from "./normalized-audit.mjs";
import { compareWishlists, generateWishlist } from "./wishlist-pipeline.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const dryRun = process.argv.includes("--dry-run");
const normalizedPath = join(root, "data/normalized/retailer-listings.local.json");
const wishlistPath = join(root, "data/wishlist.local.json");
const [normalized, inventory, previous] = await Promise.all([
  readJson(normalizedPath), readJson(join(root, "data/inventory.local.json")), readJson(wishlistPath)
]);
const observations = [];
for (const file of (await readdir(join(root, "data/raw"))).filter((name) => name.endsWith(".json"))) {
  observations.push(...extractObservations(await readJson(join(root, "data/raw", file)), basename(file)));
}
const merged = mergeObservations(normalized, observations);
const audit = auditNormalized(merged.catalogue);
const fatal = audit.issues.filter((issue) => issue.code === "duplicate_listing_id");
if (fatal.length) throw new Error(`Refresh blocked by ${fatal.length} duplicate listing IDs`);
const wishlist = generateWishlist(merged.catalogue, inventory);
const changes = compareWishlists(previous, wishlist);
console.log(JSON.stringify({ mode: dryRun ? "dry-run" : "write", observations: observations.length, normalized: merged.catalogue.items.length, updated: merged.report.updated.length, stale: merged.report.stale.length, candidates: merged.report.candidates.length, audit: audit.counts, wishlist: wishlist.items.length, added: changes.added.length, removed: changes.removed.length, changed: changes.changed.length }, null, 2));
if (!dryRun) {
  await writeFile(normalizedPath, `${JSON.stringify(merged.catalogue, null, 2)}\n`);
  await writeFile(wishlistPath, `${JSON.stringify(wishlist, null, 2)}\n`);
}

async function readJson(path) { return JSON.parse(await readFile(path, "utf8")); }
