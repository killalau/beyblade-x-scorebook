import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  inventoryLinesByBladeCategory,
  inventoryPartCategories,
  supportsRegionalChineseName,
} from "../src/inventory-parts.js";

const root = fileURLToPath(new URL("..", import.meta.url));
const beybladeBrands = Object.freeze(["Hasbro", "Takara Tomy"]);
const bitTypes = Object.freeze(["Attack", "Defense", "Stamina", "Balance"]);
const bladeSystems = Object.freeze(["standard", "expand"]);
const partNameLocales = Object.freeze(["en-US", "en-JP", "zh-TW", "zh-HK"]);
const failures = [];
const checked = [];

validateOptionalJson("data/collection.local.json", validateCollection);
validateOptionalJson("data/wishlist.local.json", validateWishlist);
validateOptionalJson(
  "data/normalized/retailer-listings.local.json",
  validateNormalizedListings,
);
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
  if (data.partsDetail !== undefined) {
    assertArray(data.partsDetail, `${label}.partsDetail`);
    for (const [index, part] of data.partsDetail.entries()) {
      assertObject(part, `${label}.partsDetail[${index}]`);
      assertBrand(part.brand, `${label}.partsDetail[${index}].brand`);
      validatePartNames(part, `${label}.partsDetail[${index}]`);
      if (part.category !== undefined) {
        assertString(part.category, `${label}.partsDetail[${index}].category`);
        assert.ok(
          inventoryPartCategories.includes(part.category),
          `${label}.partsDetail[${index}].category must be one of: ${inventoryPartCategories.join(", ")}. Confirm with the user before adding a new category.`,
        );
        const isBlade =
          part.category === "Blade" || part.category === "Main Blade";
        if (isBlade) {
          assertString(part.line, `${label}.partsDetail[${index}].line`);
          const allowedLines = inventoryLinesByBladeCategory[part.category];
          assert(
            allowedLines.includes(part.line),
            `${label}.partsDetail[${index}].line must be one of: ${allowedLines.join(", ")} for ${part.category} rows.`,
          );
          assertString(
            part.bladeSystem,
            `${label}.partsDetail[${index}].bladeSystem`,
          );
          assert(
            bladeSystems.includes(part.bladeSystem),
            `${label}.partsDetail[${index}].bladeSystem must be one of: ${bladeSystems.join(", ")}.`,
          );
        } else {
          assert(
            part.line === undefined,
            `${label}.partsDetail[${index}].line is only valid for Blade and Main Blade rows.`,
          );
          assert(
            part.bladeSystem === undefined,
            `${label}.partsDetail[${index}].bladeSystem is only valid for Blade and Main Blade rows.`,
          );
        }
        if (part.category === "Bit") {
          assertString(part.type, `${label}.partsDetail[${index}].type`);
          assert.ok(
            bitTypes.includes(part.type),
            `${label}.partsDetail[${index}].type must be one of: ${bitTypes.join(", ")}`,
          );
        }
      }
    }
  }
}

function validatePartNames(part, label) {
  assertObject(part.names, `${label}.names`);
  for (const locale of partNameLocales) {
    const value = part.names[locale];
    assert.ok(
      value === null || typeof value === "string",
      `${label}.names[${JSON.stringify(locale)}] must be a string or null`,
    );
  }
  const canonicalName = part.names["en-JP"] || part.names["en-US"];
  assertString(canonicalName, `${label}.names must include en-JP or en-US`);
  assert.equal(
    part.name,
    canonicalName,
    `${label}.name must prefer names["en-JP"] and fall back to names["en-US"]`,
  );
  if (!supportsRegionalChineseName(part.category)) {
    assert.equal(
      part.names["zh-TW"],
      null,
      `${label}.names["zh-TW"] must be null because ${part.category} has no Chinese part name`,
    );
    assert.equal(
      part.names["zh-HK"],
      null,
      `${label}.names["zh-HK"] must be null because ${part.category} has no Chinese part name`,
    );
  }
}

function validateCollection(data, label) {
  assertObject(data, label);
  assert.equal(data.version, 1, `${label}.version must be 1`);
  if (data.currency !== undefined)
    assertString(data.currency, `${label}.currency`);
  if (data.taxRegion !== undefined && data.taxRegion !== null)
    assertString(data.taxRegion, `${label}.taxRegion`);
  validateInventory(data.inventory, `${label}.inventory`);
  const acquisitionIds = validatePurchases(
    data.purchases,
    `${label}.purchases`,
  );
  validateTrades(data.trades, `${label}.trades`, acquisitionIds);
}

function validatePurchases(data, label) {
  assertObject(data, label);
  assertArray(data.items, `${label}.items`);
  const acquisitionIds = new Set();
  for (const [index, item] of data.items.entries()) {
    assertObject(item, `${label}.items[${index}]`);
    assertBrand(item.brand, `${label}.items[${index}].brand`);
    if (item.acquisitionId !== undefined) {
      assertString(
        item.acquisitionId,
        `${label}.items[${index}].acquisitionId`,
      );
      assert.equal(
        acquisitionIds.has(item.acquisitionId),
        false,
        `${label}.items[${index}].acquisitionId must be unique`,
      );
      acquisitionIds.add(item.acquisitionId);
    }
    if (item.name !== undefined)
      assertString(item.name, `${label}.items[${index}].name`);
    if (item.pretaxPrice !== undefined)
      assertNumberLike(
        item.pretaxPrice,
        `${label}.items[${index}].pretaxPrice`,
      );
    if (item.taxRate !== undefined)
      assertNumberLike(item.taxRate, `${label}.items[${index}].taxRate`);
    if (item.estimatedTotalPaid !== undefined)
      assertNumberLike(
        item.estimatedTotalPaid,
        `${label}.items[${index}].estimatedTotalPaid`,
      );
    if (item.imageUrl !== undefined)
      assertString(item.imageUrl, `${label}.items[${index}].imageUrl`);
    if (item.returnedItems !== undefined) {
      assertArray(item.returnedItems, `${label}.items[${index}].returnedItems`);
      for (const [
        returnedIndex,
        returnedItem,
      ] of item.returnedItems.entries()) {
        assertObject(
          returnedItem,
          `${label}.items[${index}].returnedItems[${returnedIndex}]`,
        );
        assertNumberLike(
          returnedItem.refundAmount,
          `${label}.items[${index}].returnedItems[${returnedIndex}].refundAmount`,
        );
      }
    }
  }
  return acquisitionIds;
}

function validateTrades(data, label, acquisitionIds) {
  if (data === undefined) return;
  assertObject(data, label);
  assertArray(data.items, `${label}.items`);
  const tradeIds = new Set();
  for (const [tradeIndex, trade] of data.items.entries()) {
    const tradeLabel = `${label}.items[${tradeIndex}]`;
    assertObject(trade, tradeLabel);
    assertString(trade.tradeId, `${tradeLabel}.tradeId`);
    assert.equal(
      tradeIds.has(trade.tradeId),
      false,
      `${tradeLabel}.tradeId must be unique`,
    );
    tradeIds.add(trade.tradeId);
    assertString(trade.tradedAt, `${tradeLabel}.tradedAt`);
    assertArray(trade.gave, `${tradeLabel}.gave`);
    assert.ok(trade.gave.length > 0, `${tradeLabel}.gave must not be empty`);
    assertArray(trade.received, `${tradeLabel}.received`);
    assert.ok(
      trade.received.length > 0,
      `${tradeLabel}.received must not be empty`,
    );
    let transferredCostBasis = 0;
    for (const [itemIndex, item] of trade.gave.entries()) {
      const itemLabel = `${tradeLabel}.gave[${itemIndex}]`;
      assertObject(item, itemLabel);
      assertString(item.name, `${itemLabel}.name`);
      assertString(item.fromAcquisitionId, `${itemLabel}.fromAcquisitionId`);
      assert.ok(
        acquisitionIds.has(item.fromAcquisitionId),
        `${itemLabel}.fromAcquisitionId must reference an existing acquisition`,
      );
      assertPositiveQuantity(item.quantity, `${itemLabel}.quantity`);
      assertNonNegativeNumber(
        item.transferredCostBasis,
        `${itemLabel}.transferredCostBasis`,
      );
      transferredCostBasis += Number(item.transferredCostBasis);
    }
    let receivedCostBasis = 0;
    for (const [itemIndex, item] of trade.received.entries()) {
      const itemLabel = `${tradeLabel}.received[${itemIndex}]`;
      assertObject(item, itemLabel);
      assertString(item.acquisitionId, `${itemLabel}.acquisitionId`);
      assert.equal(
        acquisitionIds.has(item.acquisitionId),
        false,
        `${itemLabel}.acquisitionId must be unique`,
      );
      acquisitionIds.add(item.acquisitionId);
      assertString(item.name, `${itemLabel}.name`);
      assertBrand(item.brand, `${itemLabel}.brand`);
      assertPositiveQuantity(item.quantity, `${itemLabel}.quantity`);
      assertNonNegativeNumber(item.costBasis, `${itemLabel}.costBasis`);
      assertString(item.imageUrl, `${itemLabel}.imageUrl`);
      receivedCostBasis += Number(item.costBasis);
    }
    const cashPaid = Number(trade.cashPaid ?? 0);
    const cashReceived = Number(trade.cashReceived ?? 0);
    assertNonNegativeNumber(cashPaid, `${tradeLabel}.cashPaid`);
    assertNonNegativeNumber(cashReceived, `${tradeLabel}.cashReceived`);
    assert.ok(
      !(cashPaid > 0 && cashReceived > 0),
      `${tradeLabel} must use only cashPaid or cashReceived`,
    );
    const expectedCostBasis = transferredCostBasis + cashPaid - cashReceived;
    assert.ok(
      Math.abs(receivedCostBasis - expectedCostBasis) <= 0.01,
      `${tradeLabel} received cost basis must equal transferred basis plus cash paid minus cash received`,
    );
  }
}

function validateWishlist(data, label) {
  assertObject(data, label);
  assertArray(data.items, `${label}.items`);
  for (const [index, item] of data.items.entries()) {
    assertObject(item, `${label}.items[${index}]`);
    if (item.name !== undefined)
      assertString(item.name, `${label}.items[${index}].name`);
    if (item.price !== undefined)
      assertNumberLike(item.price, `${label}.items[${index}].price`);
    if (item.score !== undefined)
      assertNumberLike(item.score, `${label}.items[${index}].score`);
    if (item.costIndex !== undefined)
      assertNumberLike(item.costIndex, `${label}.items[${index}].costIndex`);
    if (item.imageUrl !== undefined)
      assertString(item.imageUrl, `${label}.items[${index}].imageUrl`);
    if (item.createdAt !== undefined)
      assertString(item.createdAt, `${label}.items[${index}].createdAt`);
    if (item.parts !== undefined) {
      assertArray(item.parts, `${label}.items[${index}].parts`);
      for (const [partIndex, part] of item.parts.entries()) {
        const partLabel = `${label}.items[${index}].parts[${partIndex}]`;
        assertObject(part, partLabel);
        assertString(part.name, `${partLabel}.name`);
        assertString(part.type, `${partLabel}.type`);
        assert.equal(
          typeof part.owned,
          "boolean",
          `${partLabel}.owned must be boolean`,
        );
      }
    }
  }
}

function validateNormalizedListings(data, label) {
  assertObject(data, label);
  assertArray(data.items, `${label}.items`);
  const ids = new Set();
  const allowedStatuses = new Set([
    "available_now",
    "preorder",
    "delayed",
    "backorder",
    "out_of_stock",
    "unavailable",
    "not_observed",
    "unknown",
  ]);
  for (const [index, item] of data.items.entries()) {
    const itemLabel = `${label}.items[${index}]`;
    assertObject(item, itemLabel);
    assertString(item.listingId, `${itemLabel}.listingId`);
    assert.equal(
      ids.has(item.listingId),
      false,
      `${itemLabel}.listingId must be unique`,
    );
    ids.add(item.listingId);
    assertString(item.name, `${itemLabel}.name`);
    assertString(item.retailer, `${itemLabel}.retailer`);
    assertString(item.url, `${itemLabel}.url`);
    assertArray(item.configs, `${itemLabel}.configs`);
    assert.equal(
      allowedStatuses.has(item.availabilityStatus),
      true,
      `${itemLabel}.availabilityStatus is invalid`,
    );
    assert.equal(
      typeof item.orderable,
      "boolean",
      `${itemLabel}.orderable must be boolean`,
    );
  }
}

function validatePublicCatalogue(data, label) {
  assertObject(data, label);
  assert.equal(data.version, 1, `${label}.version must be 1`);
  validateNormalizedListings(data, label);
  for (const [index, item] of data.items.entries()) {
    assert.equal(
      "notes" in item,
      false,
      `${label}.items[${index}] must not expose notes`,
    );
    assert.equal(
      "availabilityText" in item,
      false,
      `${label}.items[${index}] must not expose availabilityText`,
    );
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

function assertBrand(value, label) {
  assertString(value, label);
  assert.ok(
    beybladeBrands.includes(value),
    `${label} must be one of: ${beybladeBrands.join(", ")}`,
  );
}

function assertNumberLike(value, label) {
  const numeric = Number(value);
  assert.equal(Number.isFinite(numeric), true, `${label} must be numeric`);
}

function assertNonNegativeNumber(value, label) {
  assertNumberLike(value, label);
  assert.ok(Number(value) >= 0, `${label} must be non-negative`);
}

function assertPositiveQuantity(value, label) {
  if (value === undefined) return;
  assertNumberLike(value, label);
  assert.ok(Number(value) > 0, `${label} must be greater than zero`);
}
