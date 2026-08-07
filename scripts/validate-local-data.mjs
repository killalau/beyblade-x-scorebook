import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const failures = [];
const checked = [];

validateOptionalJson("data/collection.local.json", validateCollection);
validateOptionalJson("data/wishlist.local.json", validateWishlist);
validateOptionalJson("data/normalized/retailer-listings.local.json", validateNormalizedListings);
validateOptionalJson("data/retailer-listings.json", validatePublicCatalogue);
validateRawDirectory("data/raw");

if (failures.length) {
  console.error("Local data validation failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

if (checked.length) {
  console.log(`Validated local data: ${checked.join(", ")}`);
} else {
  console.log("No private local data files found; validation skipped.");
}

function validateOptionalJson(relativePath, validator) {
  const path = join(root, relativePath);
  if (!existsSync(path)) return;
  try {
    const data = readJson(path);
    validator(data, relativePath);
    checked.push(relativePath);
  } catch (error) {
    failures.push(`${relativePath}: ${error.message}`);
  }
}

function validateRawDirectory(relativePath) {
  const directory = join(root, relativePath);
  if (!existsSync(directory)) return;
  for (const file of listJsonFiles(directory)) {
    try {
      readJson(file);
      checked.push(file.replace(root, ""));
    } catch (error) {
      failures.push(`${file}: ${error.message}`);
    }
  }
}

function validateInventory(data, label) {
  assertObject(data, label);
  assertArray(data.parts, `${label}.parts`);
  assertArray(data.beys, `${label}.beys`);
  if (data.partsDetail !== undefined) assertArray(data.partsDetail, `${label}.partsDetail`);
}

function validateCollection(data, label) {
  assertObject(data, label);
  assert.equal(data.version, 1, `${label}.version must be 1`);
  if (data.currency !== undefined) assertString(data.currency, `${label}.currency`);
  if (data.taxRegion !== undefined && data.taxRegion !== null) assertString(data.taxRegion, `${label}.taxRegion`);
  validateInventory(data.inventory, `${label}.inventory`);
  validatePurchases(data.purchases, `${label}.purchases`);
}

function validatePurchases(data, label) {
  assertObject(data, label);
  assertArray(data.items, `${label}.items`);
  for (const [index, item] of data.items.entries()) {
    assertObject(item, `${label}.items[${index}]`);
    if (item.name !== undefined) assertString(item.name, `${label}.items[${index}].name`);
    if (item.pretaxPrice !== undefined) assertNumberLike(item.pretaxPrice, `${label}.items[${index}].pretaxPrice`);
    if (item.taxRate !== undefined) assertNumberLike(item.taxRate, `${label}.items[${index}].taxRate`);
    if (item.estimatedTotalPaid !== undefined) assertNumberLike(item.estimatedTotalPaid, `${label}.items[${index}].estimatedTotalPaid`);
  }
}

function validateWishlist(data, label) {
  assertObject(data, label);
  assertArray(data.items, `${label}.items`);
  for (const [index, item] of data.items.entries()) {
    assertObject(item, `${label}.items[${index}]`);
    if (item.name !== undefined) assertString(item.name, `${label}.items[${index}].name`);
    if (item.price !== undefined) assertNumberLike(item.price, `${label}.items[${index}].price`);
    if (item.score !== undefined) assertNumberLike(item.score, `${label}.items[${index}].score`);
    if (item.costIndex !== undefined) assertNumberLike(item.costIndex, `${label}.items[${index}].costIndex`);
    if (item.imageUrl !== undefined) assertString(item.imageUrl, `${label}.items[${index}].imageUrl`);
    if (item.createdAt !== undefined) assertString(item.createdAt, `${label}.items[${index}].createdAt`);
    if (item.parts !== undefined) {
      assertArray(item.parts, `${label}.items[${index}].parts`);
      for (const [partIndex, part] of item.parts.entries()) {
        const partLabel = `${label}.items[${index}].parts[${partIndex}]`;
        assertObject(part, partLabel);
        assertString(part.name, `${partLabel}.name`);
        assertString(part.type, `${partLabel}.type`);
        assert.equal(typeof part.owned, "boolean", `${partLabel}.owned must be boolean`);
      }
    }
  }
}

function validateNormalizedListings(data, label) {
  assertObject(data, label);
  assertArray(data.items, `${label}.items`);
  const ids = new Set();
  const allowedStatuses = new Set(["available_now", "preorder", "delayed", "backorder", "out_of_stock", "unavailable", "not_observed", "unknown"]);
  for (const [index, item] of data.items.entries()) {
    const itemLabel = `${label}.items[${index}]`;
    assertObject(item, itemLabel);
    assertString(item.listingId, `${itemLabel}.listingId`);
    assert.equal(ids.has(item.listingId), false, `${itemLabel}.listingId must be unique`);
    ids.add(item.listingId);
    assertString(item.name, `${itemLabel}.name`);
    assertString(item.retailer, `${itemLabel}.retailer`);
    assertString(item.url, `${itemLabel}.url`);
    assertArray(item.configs, `${itemLabel}.configs`);
    assert.equal(allowedStatuses.has(item.availabilityStatus), true, `${itemLabel}.availabilityStatus is invalid`);
    assert.equal(typeof item.orderable, "boolean", `${itemLabel}.orderable must be boolean`);
  }
}

function validatePublicCatalogue(data, label) {
  assertObject(data, label);
  assert.equal(data.version, 1, `${label}.version must be 1`);
  validateNormalizedListings(data, label);
  for (const [index, item] of data.items.entries()) {
    assert.equal("notes" in item, false, `${label}.items[${index}] must not expose notes`);
    assert.equal("availabilityText" in item, false, `${label}.items[${index}] must not expose availabilityText`);
  }
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function listJsonFiles(path) {
  const stats = statSync(path);
  if (stats.isFile()) return path.endsWith(".json") ? [path] : [];
  return readdirSync(path).flatMap((entry) => listJsonFiles(join(path, entry)));
}

function assertObject(value, label) {
  assert.equal(typeof value, "object", `${label} must be an object`);
  assert.notEqual(value, null, `${label} must not be null`);
  assert.equal(Array.isArray(value), false, `${label} must not be an array`);
}

function assertArray(value, label) {
  assert.equal(Array.isArray(value), true, `${label} must be an array`);
}

function assertString(value, label) {
  assert.equal(typeof value, "string", `${label} must be a string`);
}

function assertNumberLike(value, label) {
  const numeric = Number(value);
  assert.equal(Number.isFinite(numeric), true, `${label} must be numeric`);
}
