import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import { canonicalPartName } from "../src/inventory-parts.js";

const root = fileURLToPath(new URL("..", import.meta.url));
const collectionPath = fileURLToPath(
  new URL("../data/collection.local.json", import.meta.url),
);
const dryRun = process.argv.includes("--dry-run");
const locales = ["en-US", "zh-TW", "zh-HK"];
const componentCategories = new Map([
  ["Blade", "Blade"],
  ["Lock Chip", "LockChip"],
  ["Main Blade", "MainBlade"],
  ["Metal Blade", "MetalBlade"],
  ["Over Blade", "OverBlade"],
  ["Assist Blade", "AssistBlade"],
  ["Ratchet", "Ratchet"],
  ["Bit", "Bit"],
]);
const dataGroupByCategory = new Map(
  [...componentCategories.values()].map((category) => [
    category,
    `BeybladeParts${category}`,
  ]),
);

const collection = JSON.parse(readFileSync(collectionPath, "utf8"));
const [ttRecords, hasbroRecords, partCodeNames, imageModule] =
  await Promise.all([
    loadRecords(["main", "hardcoded"]),
    loadRecords(["hasbro"]),
    fetchJson("part_code_names.json"),
    loadImageModule(),
  ]);

const ttByGroup = indexByGroup(ttRecords);
const hasbroByGroup = indexByGroup(hasbroRecords);
const stats = {
  rows: 0,
  renamed: 0,
  withHasbroEnglish: 0,
  withTakaraEnglish: 0,
  withTaiwanChinese: 0,
  withHongKongChinese: 0,
};

for (const part of collection.inventory.partsDetail ?? []) {
  const previousName = part.name;
  const names = resolveNames(
    part,
    imageModule.inventoryPartImageRefs,
    ttRecords,
    hasbroRecords,
    ttByGroup,
    hasbroByGroup,
    partCodeNames,
  );
  part.names = names;
  part.name = names["en-JP"] || names["en-US"];
  stats.rows += 1;
  if (part.name !== previousName) stats.renamed += 1;
  if (names["en-US"]) stats.withHasbroEnglish += 1;
  if (names["en-JP"]) stats.withTakaraEnglish += 1;
  if (names["zh-TW"]) stats.withTaiwanChinese += 1;
  if (names["zh-HK"]) stats.withHongKongChinese += 1;
}

if (!dryRun) {
  writeFileSync(collectionPath, `${JSON.stringify(collection, null, 2)}\n`);
}

console.log(
  `${dryRun ? "Would sync" : "Synced"} localized names for ${stats.rows} part rows.`,
);
console.log(JSON.stringify(stats, null, 2));

async function loadImageModule() {
  const server = await createServer({
    root,
    appType: "custom",
    logLevel: "silent",
    server: { middlewareMode: true },
  });
  try {
    return await server.ssrLoadModule("/src/features/inventory/part-images.ts");
  } finally {
    await server.close();
  }
}

async function loadRecords(datasets) {
  const records = new Map();
  for (const dataset of datasets) {
    for (const locale of locales) {
      let payload;
      try {
        payload = await fetchJson(`${dataset}.${locale}.json`);
      } catch (error) {
        if (dataset !== "hardcoded") throw error;
        continue;
      }
      mergeRecords(records, payload);
    }
  }
  return records;
}

function mergeRecords(records, payload) {
  for (const [group, groupRecords] of Object.entries(payload.data ?? {})) {
    for (const [key, record] of Object.entries(groupRecords ?? {})) {
      const id = record.id || key;
      if (!id) continue;
      const previous = records.get(id) ?? {};
      records.set(id, {
        ...previous,
        ...record,
        _group: group,
        name: { ...(previous.name ?? {}), ...(record.name ?? {}) },
        tt_name: { ...(previous.tt_name ?? {}), ...(record.tt_name ?? {}) },
      });
    }
  }
}

function indexByGroup(records) {
  const index = new Map();
  for (const record of records.values()) {
    if (!record.group_id || !record._group) continue;
    const key = `${record._group}|${record.group_id}`;
    const candidates = index.get(key) ?? [];
    candidates.push(record);
    index.set(key, candidates);
  }
  return index;
}

function resolveNames(
  part,
  inventoryPartImageRefs,
  ttRecords,
  hasbroRecords,
  ttByGroup,
  hasbroByGroup,
  codeNames,
) {
  const category = componentCategories.get(part.category);
  if (!category) return fallbackNames(part);

  const ref = inventoryPartImageRefs(part)[0];
  const identity = ref ? componentIdentity(ref.detailUrl) : null;
  const exactRecord = identity
    ? (identity.id.startsWith("HB-") ? hasbroRecords : ttRecords).get(
        identity.id,
      )
    : undefined;
  const group = dataGroupByCategory.get(category);
  const groupId = exactRecord?.group_id || part.abbrev || part.name;
  const groupKey = `${group}|${groupId}`;
  const ttRecord = exactRecord?.id?.startsWith("HB-")
    ? firstUsable(ttByGroup.get(groupKey))
    : exactRecord || firstUsable(ttByGroup.get(groupKey));
  const hasbroRecord = exactRecord?.id?.startsWith("HB-")
    ? exactRecord
    : firstUsable(hasbroByGroup.get(groupKey));
  const codeEntry = codeNameEntry(part, exactRecord, codeNames);

  const hasbroEnglish = codeEntry
    ? hasbroRecord
      ? codeEntry.name?.["en-US"] || cleanCurrentName(part.name, "en-US")
      : null
    : localizedRecordName(hasbroRecord, "en-US", category);
  const takaraEnglish = codeEntry
    ? codeEntry.name?.["en-US"] || cleanCurrentName(part.name, "en-JP")
    : ttRecord?.tt_name?.["en-US"] ||
      hasbroRecord?.tt_name?.["en-US"] ||
      localizedRecordName(ttRecord, "en-US", category);
  const taiwanChinese =
    codeEntry?.name?.["zh-TW"] ||
    localizedRecordName(ttRecord, "zh-TW", category) ||
    localizedRecordName(hasbroRecord, "zh-TW", category);
  const hongKongChinese =
    codeEntry?.name?.["zh-HK"] ||
    localizedRecordName(ttRecord, "zh-HK", category) ||
    localizedRecordName(hasbroRecord, "zh-HK", category) ||
    taiwanChinese;

  return ensureEnglishFallback(part, {
    "en-US": hasbroEnglish,
    "en-JP": takaraEnglish,
    "zh-TW": taiwanChinese,
    "zh-HK": hongKongChinese,
  });
}

function componentIdentity(detailUrl) {
  const match = String(detailUrl).match(/\/p\/[^/]+\/([^/]+)\/([^/.]+)\.html$/);
  return match ? { category: match[1], id: match[2] } : null;
}

function firstUsable(records = []) {
  return records.find((record) => !record.invalid) ?? records[0];
}

function codeNameEntry(part, record, codeNames) {
  const category = componentCategories.get(part.category);
  if (!category || !["Bit", "AssistBlade", "OverBlade"].includes(category)) {
    return null;
  }
  const code = record?.group_id || part.abbrev;
  return codeNames[category]?.[code] ?? null;
}

function localizedRecordName(record, locale, category) {
  const value = record?.name?.[locale];
  if (!value || value === "■") return null;
  const prefixes = [record.set_id, record.base_set_id, record.hasbro_sku]
    .filter(Boolean)
    .sort((left, right) => right.length - left.length);
  for (const prefix of prefixes) {
    if (value === prefix) return normalizeComponentName(value, category);
    if (value.startsWith(`${prefix} `)) {
      return normalizeComponentName(
        value.slice(prefix.length).trim(),
        category,
      );
    }
  }
  return normalizeComponentName(value, category);
}

function normalizeComponentName(value, category) {
  return canonicalPartName(value, category);
}

function fallbackNames(part) {
  const current = cleanCurrentName(
    part.name,
    part.brand === "Takara Tomy" ? "en-JP" : "en-US",
  );
  return ensureEnglishFallback(part, {
    "en-US": part.brand === "Hasbro" ? current : null,
    "en-JP": part.brand === "Takara Tomy" ? current : null,
    "zh-TW": null,
    "zh-HK": null,
  });
}

function ensureEnglishFallback(part, names) {
  const fallback = cleanCurrentName(
    part.name,
    part.brand === "Takara Tomy" ? "en-JP" : "en-US",
  );
  if (!names["en-JP"] && !names["en-US"]) {
    names[part.brand === "Takara Tomy" ? "en-JP" : "en-US"] = fallback;
  }
  return Object.fromEntries(
    Object.entries(names).map(([locale, value]) => [
      locale,
      value ? String(value).trim() : null,
    ]),
  );
}

function cleanCurrentName(value, preferredLocale) {
  const names = String(value ?? "")
    .split("/")
    .map((name) => name.trim())
    .filter(Boolean);
  if (names.length < 2) return names[0] || "Unknown";
  return preferredLocale === "en-JP" ? names.at(-1) : names[0];
}

async function fetchJson(file) {
  const url = `https://beyblade.phstudy.org/data/${file}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response.json();
}
