import { access, readFile, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { fileURLToPath } from "node:url";
import { combineLegacyCollection } from "./collection-data.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const inventoryPath = `${root}/data/inventory.local.json`;
const purchasesPath = `${root}/data/purchases.local.json`;
const collectionPath = `${root}/data/collection.local.json`;
const force = process.argv.includes("--force");

if (!force && await exists(collectionPath)) {
  throw new Error("data/collection.local.json already exists; use --force only after confirming overwrite is intended");
}

const [inventory, purchases] = await Promise.all([readJson(inventoryPath), readJson(purchasesPath)]);
const collection = combineLegacyCollection(inventory, purchases);
await writeFile(collectionPath, `${JSON.stringify(collection, null, 2)}\n`);

console.log(JSON.stringify({
  written: "data/collection.local.json",
  version: collection.version,
  inventory: {
    parts: collection.inventory.parts.length,
    beys: collection.inventory.beys.length,
    partsDetail: collection.inventory.partsDetail.length
  },
  purchases: collection.purchases.items.length,
  legacyInputsPreserved: ["data/inventory.local.json", "data/purchases.local.json"]
}, null, 2));

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function exists(path) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}
