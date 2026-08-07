import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const defaultInput = fileURLToPath(new URL("../data/normalized/retailer-listings.local.json", import.meta.url));
const defaultOutput = fileURLToPath(new URL("../data/retailer-listings.json", import.meta.url));

export function buildPublicCatalogue(source) {
  const items = (source.items ?? [])
    .filter((item) => item.normalizationStatus === "verified")
    .map((item) => compact({
      listingId: item.listingId,
      retailer: item.retailer,
      productId: item.productId,
      name: item.name,
      price: item.price,
      currency: item.currency ?? source.currency ?? "CAD",
      statusLabel: item.statusLabel,
      availabilityStatus: item.availabilityStatus,
      orderable: item.orderable,
      bundleType: item.bundleType,
      includedBeys: item.includedBeys,
      configs: Array.isArray(item.configs) ? item.configs : [],
      cxMode: item.cxMode,
      url: item.url,
      imageUrl: item.imageUrl,
      firstSeenAt: item.firstSeenAt,
      lastSeenAt: item.lastSeenAt,
      lastAvailableAt: item.lastAvailableAt
    }))
    .sort((a, b) => a.listingId.localeCompare(b.listingId));

  return {
    version: 1,
    currency: source.currency ?? "CAD",
    generatedAt: latestTimestamp(items.flatMap((item) => [item.lastSeenAt, item.firstSeenAt])),
    items
  };
}

function compact(value) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined));
}

function latestTimestamp(values) {
  const valid = values
    .filter((value) => Number.isFinite(Date.parse(value)))
    .sort((a, b) => Date.parse(b) - Date.parse(a));
  return valid[0] ?? null;
}

function run() {
  const dryRun = process.argv.includes("--dry-run");
  const source = JSON.parse(readFileSync(defaultInput, "utf8"));
  const catalogue = buildPublicCatalogue(source);
  const output = `${JSON.stringify(catalogue, null, 2)}\n`;

  if (!dryRun) writeFileSync(defaultOutput, output);
  console.log(`${dryRun ? "Would export" : "Exported"} ${catalogue.items.length} verified listings to data/retailer-listings.json.`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  run();
}
