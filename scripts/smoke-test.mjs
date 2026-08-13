import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { parseConfig, scoreProduct } from "../src/scoring.js";
import { matchesPartFilters, partFilterTokens } from "../src/wishlist-filters.js";
import { calculateTotalSpend, purchasePaidAmount } from "../src/collection-summary.js";
import { generateWishlist, isWishlistEligible, listingIdFor, normalizeStatus } from "./wishlist-pipeline.mjs";
import { auditNormalized } from "./normalized-audit.mjs";
import { extractObservations, mergeObservations } from "./crawl-normalizer.mjs";
import { combineLegacyCollection, inventoryFromCollection } from "./collection-data.mjs";
import { buildPublicCatalogue } from "./export-public-catalogue.mjs";

const publicCatalogue = buildPublicCatalogue({ currency: "CAD", items: [
  { listingId: "shop:1", retailer: "Shop", name: "Missing Product", url: "https://example.com/1", configs: ["Test 1-60R"], availabilityStatus: "out_of_stock", orderable: false, normalizationStatus: "verified", notes: "Private note", availabilityText: "Local delivery context", lastSeenAt: "2026-08-01T00:00:00Z" },
  { listingId: "shop:2", retailer: "Shop", name: "Review Product", url: "https://example.com/2", configs: [], availabilityStatus: "unknown", orderable: false, normalizationStatus: "needs_review" }
] });
assert.equal(publicCatalogue.items.length, 1);
assert.equal(publicCatalogue.items[0].availabilityStatus, "out_of_stock");
assert.equal("notes" in publicCatalogue.items[0], false);
assert.equal("availabilityText" in publicCatalogue.items[0], false);

const migratedCollection = combineLegacyCollection(
  { parts: ["LR"], beys: ["Test 1-60LR"], partsDetail: [{ name: "LR" }] },
  { currency: "CAD", taxRegion: "BC", items: [{ name: "Test purchase" }] }
);
assert.equal(migratedCollection.version, 1);
assert.deepEqual(inventoryFromCollection(migratedCollection).parts, ["LR"]);
assert.equal(migratedCollection.purchases.items[0].name, "Test purchase");
assert.equal(calculateTotalSpend({ items: [
  { estimatedTotalPaid: 22.39, pretaxPrice: 19.99, taxRate: 0.12 },
  { pretaxPrice: 20, taxIncluded: true },
  { pretaxPrice: 10, taxRate: 0.12 }
] }), 53.59);
assert.equal(purchasePaidAmount({ pretaxPrice: 20 }), 20);

const keel = scoreProduct({
  name: "Keel Shark 3-60LF Booster",
  configs: ["Keel Shark 3-60LF"],
  price: 12.99
});
assert.equal(keel.score, 4);

const dual = scoreProduct(
  {
    name: "Gill Shark 4-70O, Pearl Tiger 3-60U Dual Pack",
    configs: ["Gill Shark 4-70O", "Pearl Tiger 3-60U"],
    price: 22.98
  },
  { ownedParts: ["3-60", "U"], rareParts: ["Gill Shark"] }
);
assert.equal(dual.score, 6);
assert.equal(dual.costIndex, null);

const rage = scoreProduct({
  name: "Rage Ragna FE4-55Y",
  configs: ["Rage Ragna FE4-55Y"],
  price: 19.99
}, {
  cxMode: true
});
assert.equal(rage.parts.find((part) => part.name === "Rage").partScore, 4.5);

const normalRage = scoreProduct({
  name: "Rage Ragna FE4-55Y",
  configs: ["Rage Ragna FE4-55Y"],
  price: 19.99
});
assert.equal(normalRage.parts.some((part) => part.type === "overBlade"), false);
assert.equal(normalRage.parts.some((part) => part.type === "assistBlade"), false);

const buster = scoreProduct({
  name: "Buster Dran 1-60A",
  configs: ["Buster Dran 1-60A"],
  price: 19.99
});
assert.equal(buster.parts.some((part) => part.name === "Dran Buster" && part.type === "blade"), true);

const antlerCx = scoreProduct({
  name: "Antler Stag B 2-60HN",
  configs: ["Antler Stag B 2-60HN"],
  price: 19.99
}, {
  cxMode: true
});
assert.equal(antlerCx.parts.some((part) => part.type === "assistBlade" && part.name === "B"), true);

const blastPegasus = scoreProduct({
  name: "Blast Pegasus A Tr",
  configs: ["Blast Pegasus A Tr"],
  price: 42.36
}, {
  cxMode: true
});
assert.deepEqual(blastPegasus.parts.map(({ name, type }) => ({ name, type })), [
  { name: "Blast", type: "blade" },
  { name: "Pegasus", type: "lockChip" },
  { name: "A", type: "assistBlade" },
  { name: "Tr", type: "bit" }
]);
assert.equal(blastPegasus.parts.find((part) => part.name === "Blast").rankDetail, "T0");
assert.equal(blastPegasus.parts.find((part) => part.name === "Blast").partScore, 7.5);

const blitzBahamut = scoreProduct({
  name: "Blitz Bahamut BK 1-50I",
  configs: ["Blitz Bahamut BK 1-50I"],
  price: 19.96
}, { cxMode: true });
assert.deepEqual(blitzBahamut.parts.map(({ name, type }) => ({ name, type })), [
  { name: "Blitz", type: "blade" },
  { name: "Bahamut", type: "lockChip" },
  { name: "Break", type: "overBlade" },
  { name: "Knuckle", type: "assistBlade" },
  { name: "1-50", type: "ratchet" },
  { name: "I", type: "bit" }
]);
assert.equal(blitzBahamut.parts.find((part) => part.name === "I").displayName, "Ignition");

const newOwnedCxBeys = [
  ["Flame Cerberus W 5-80WB", ["Flame", "Cerberus", "Wheel", "5-80", "WB"]],
  ["Rage Ragna FE4-55Y", ["Rage", "Ragna", "Flow", "Erase", "4-55", "Y"]],
  ["Fortress Knight GV8-70UN", ["Fortress", "Knight", "Guard", "Vertical", "8-70", "UN"]],
  ["Reaper Incendio T4-70K", ["Reaper", "Incendio", "Turn", "4-70", "K"]]
];
for (const [config, expectedParts] of newOwnedCxBeys) {
  assert.deepEqual(parseConfig(config, { cxMode: true }).map((part) => part.name), expectedParts);
}

const fusedOp = scoreProduct({
  name: "Test Pegasus A Op",
  configs: ["Test Pegasus A Op"],
  price: 20
}, { cxMode: true });
assert.equal(fusedOp.parts.some((part) => part.name === "Op" && part.type === "bit"), true);

assert.equal(listingIdFor("Amazon.ca", "https://www.amazon.ca/dp/B0GP22FMHL"), "amazon-ca:B0GP22FMHL");
assert.equal(normalizeStatus("Unavailable"), "unavailable");
assert.equal(isWishlistEligible({ availabilityStatus: "unavailable", orderable: false }), false);
const generatedWishlist = generateWishlist({ currency: "CAD", items: [{
  listingId: "amazon-ca:B0D88KFJQP",
  retailer: "Amazon.ca",
  name: "Buster Dran 1-60A Starter",
  price: 19.99,
  statusLabel: "Available now",
  availabilityStatus: "available_now",
  orderable: true,
  normalizationStatus: "verified",
  bundleType: "Starter",
  includedBeys: "Buster Dran 1-60A",
  configs: ["Buster Dran 1-60A"],
  cxMode: false,
  url: "https://www.amazon.ca/dp/B0D88KFJQP",
  notes: "",
  availabilityText: "In stock"
}] }, { parts: ["Dran Buster", "1-60", "A"] });
assert.equal(generatedWishlist.items[0].costIndex, null);
assert.equal(generatedWishlist.items[0].usefulParts, "-");
assert.equal(generatedWishlist.items[0].parts.some((part) => part.name === "1-60" && part.type === "ratchet" && part.owned), true);
assert.equal(isWishlistEligible({ availabilityStatus: "available_now", orderable: true, normalizationStatus: "needs_review" }), false);

const partFilterItem = {
  parts: [
    { name: "7-60", type: "ratchet", owned: false },
    { name: "LR", type: "bit", owned: true }
  ]
};
assert.deepEqual(partFilterTokens(" LR, 7-60, LR "), ["lr", "7-60"]);
assert.equal(matchesPartFilters(partFilterItem, { requestedParts: ["lr"] }), true);
assert.equal(matchesPartFilters(partFilterItem, { requestedParts: ["lr", "7-60"], matchAll: true }), true);
assert.equal(matchesPartFilters(partFilterItem, { requestedParts: ["lr"], onlyMissing: true }), false);
assert.equal(matchesPartFilters(partFilterItem, { requestedParts: ["7-60"], partType: "bit" }), false);

const crawlObservations = extractObservations({
  collectedAt: "2026-08-02T12:00:00Z",
  retailer: "Amazon.ca",
  normalizedListings: [{ asin: "B0GP22FMHL", rawTitle: "Raw title", rawPriceText: "$69.99", availabilityText: "In Stock", sourceUrl: "https://www.amazon.ca/dp/B0GP22FMHL" }]
}, "test.json");
assert.equal(crawlObservations.length, 1);
const mergedCatalogue = mergeObservations({ items: [{
  listingId: "amazon-ca:B0GP22FMHL",
  name: "Normalized title",
  url: "https://www.amazon.ca/dp/B0GP22FMHL",
  lastSeenAt: "2026-08-01T12:00:00Z"
}] }, crawlObservations).catalogue;
assert.equal(mergedCatalogue.items[0].name, "Normalized title");
assert.equal(mergedCatalogue.items[0].price, 69.99);
const unknownStatusMerge = mergeObservations({ items: [{
  listingId: "amazon-ca:B0GP22FMHL",
  name: "Normalized title",
  url: "https://www.amazon.ca/dp/B0GP22FMHL",
  availabilityStatus: "available_now",
  statusLabel: "Available now",
  orderable: true,
  lastSeenAt: "2026-08-01T12:00:00Z"
}] }, [{ ...crawlObservations[0], availabilityStatus: "unknown", observedAt: "2026-08-03T12:00:00Z" }]).catalogue;
assert.equal(unknownStatusMerge.items[0].availabilityStatus, "available_now");
const delayedDeliveryMerge = mergeObservations({ items: [{
  listingId: "walmart-ca:TEST12345678",
  name: "Delayed product",
  url: "https://www.walmart.ca/en/ip/TEST12345678",
  availabilityStatus: "available_now",
  orderable: true,
  lastSeenAt: "2026-08-01T12:00:00Z"
}] }, extractObservations({
  collectedAt: "2026-08-11T12:00:00-07:00",
  sources: [{
    retailer: "Walmart.ca",
    verifiedListings: [{
      productId: "TEST12345678",
      sourceUrl: "https://www.walmart.ca/en/ip/TEST12345678",
      availabilityText: "Delivery, Fri Aug 21",
      availabilityStatus: "available_now"
    }]
  }]
})).catalogue;
assert.equal(delayedDeliveryMerge.items[0].availabilityStatus, "delayed");
const pickupTodayObservation = extractObservations({
  collectedAt: "2026-08-11T12:00:00-07:00",
  sources: [{
    retailer: "Walmart.ca",
    verifiedListings: [{
      productId: "TEST87654321",
      sourceUrl: "https://www.walmart.ca/en/ip/TEST87654321",
      availabilityText: "Delivery, Fri Aug 21 | Free pickup, today",
      availabilityStatus: "available_now"
    }]
  }]
})[0];
assert.equal(pickupTodayObservation.availabilityStatus, "available_now");
assert.equal(auditNormalized({ items: [{ listingId: "x:1", name: "Test", configs: [], availabilityStatus: "unknown", normalizationStatus: "needs_review", url: "https://example.com" }] }).issueCount > 0, true);

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
assert.match(html, /id="productRows"/);
assert.match(html, /id="addProductRow"/);
assert.match(html, /id="scorebookPage"/);
assert.match(html, /id="inventoryPage"/);
assert.match(html, /id="inventoryTotalSpend"/);
assert.match(html, /id="collectionFile"/);
assert.match(html, /id="wishlistPage"/);
assert.match(html, /id="wishlistFile"/);
assert.match(html, /id="cataloguePage"/);
assert.doesNotMatch(html, /id="catalogueFile"/);
assert.match(html, /id="catalogueSort"/);
assert.match(html, /data-wishlist-view="card"/);
assert.match(html, /value="createdAt"/);
assert.match(html, /id="rulesPage"/);
assert.match(html, /id="clearLocalData"/);
const appSource = readFileSync(new URL("../src/app.js", import.meta.url), "utf8");
assert.match(appSource, /wishlist-price/);
assert.match(appSource, /sortablePositiveValue/);
assert.match(appSource, /sortableCreatedAt/);
assert.match(appSource, /wishlist-thumbnail/);
assert.match(appSource, /localStorage/);
assert.match(appSource, /validateCollectionData/);
assert.match(appSource, /loadPublicCatalogue/);
assert.match(appSource, /renderCatalogue/);
assert.match(appSource, /compareCatalogueItems/);

checkRelativeImports(resolve(new URL("..", import.meta.url).pathname), ["src", "scripts"]);

console.log("Smoke tests passed");

function checkRelativeImports(projectRoot, folders) {
  const sourceFiles = folders.flatMap((folder) => listJsFiles(join(projectRoot, folder)));
  const importPattern = /(?:import|export)\s+(?:[^'"]+\s+from\s+)?["'](\.{1,2}\/[^"']+)["']/g;

  for (const file of sourceFiles) {
    const source = readFileSync(file, "utf8");
    for (const match of source.matchAll(importPattern)) {
      const target = resolve(dirname(file), match[1]);
      assert.ok(
        resolvesAsModule(target),
        `Missing relative import target from ${file}: ${match[1]}`
      );
    }
  }
}

function listJsFiles(path) {
  if (!existsSync(path)) return [];
  const stats = statSync(path);
  if (stats.isFile()) return extname(path) === ".js" || extname(path) === ".mjs" ? [path] : [];
  return readdirSync(path)
    .flatMap((entry) => listJsFiles(join(path, entry)));
}

function resolvesAsModule(target) {
  return existsSync(target) || existsSync(`${target}.js`) || existsSync(`${target}.mjs`) || existsSync(join(target, "index.js"));
}
