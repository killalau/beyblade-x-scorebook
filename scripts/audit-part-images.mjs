import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
const collectionPath = fileURLToPath(
  new URL("../data/collection.local.json", import.meta.url),
);
const collection = JSON.parse(readFileSync(collectionPath, "utf8"));
const imageModule = await loadImageModule();
const rows = (collection.inventory.partsDetail ?? []).filter(
  (part) => part.category !== "Complete Combo",
);
const missingMappings = [];
const rowsByUrl = new Map();

for (const part of rows) {
  const ref = imageModule.inventoryPartImageRefs(part)[0];
  if (!ref) {
    missingMappings.push(part);
    continue;
  }
  const linkedRows = rowsByUrl.get(ref.url) ?? [];
  linkedRows.push(part);
  rowsByUrl.set(ref.url, linkedRows);
}

const brokenUrls = [];
const urls = [...rowsByUrl.keys()];
for (let index = 0; index < urls.length; index += 4) {
  const batch = urls.slice(index, index + 4);
  const results = await Promise.all(batch.map(checkUrl));
  brokenUrls.push(...results.filter((result) => !result.ok));
}

console.log(
  `Audited ${rows.length} displayed part rows across ${urls.length} unique image URLs.`,
);
printRows("Rows without an image mapping", missingMappings);
if (brokenUrls.length) {
  console.log(`Broken image URLs (${brokenUrls.length}):`);
  for (const result of brokenUrls) {
    const names = rowsByUrl
      .get(result.url)
      .map((part) => `${part.name} [${part.source ?? "unknown source"}]`)
      .join("; ");
    console.log(`- HTTP ${result.status}: ${names}\n  ${result.url}`);
  }
}

if (missingMappings.length || brokenUrls.length) process.exitCode = 1;
else console.log("All displayed Inventory parts have reachable thumbnails.");

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

async function checkUrl(url) {
  try {
    const response = await fetch(url, {
      headers: { Range: "bytes=0-0" },
      redirect: "follow",
    });
    await response.body?.cancel();
    return { ok: response.ok, status: response.status, url };
  } catch (error) {
    return { ok: false, status: error.code ?? "network-error", url };
  }
}

function printRows(label, parts) {
  if (!parts.length) return;
  console.log(`${label} (${parts.length}):`);
  for (const part of parts) {
    console.log(
      `- ${part.category}: ${part.name} [${part.source ?? "unknown source"}]`,
    );
  }
}
