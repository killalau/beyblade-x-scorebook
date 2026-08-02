import { readdir, readFile, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import { extractObservations, mergeObservations } from "./crawl-normalizer.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const normalizedPath = join(root, "data/normalized/retailer-listings.local.json");
const dryRun = process.argv.includes("--dry-run");
const verbose = process.argv.includes("--verbose");
const requested = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));
const files = requested.length
  ? requested.map((file) => join(root, file))
  : (await readdir(join(root, "data/raw"))).filter((file) => file.endsWith(".json")).map((file) => join(root, "data/raw", file));
const catalogue = JSON.parse(await readFile(normalizedPath, "utf8"));
const observations = [];
for (const file of files) {
  const raw = JSON.parse(await readFile(file, "utf8"));
  observations.push(...extractObservations(raw, basename(file)));
}
const merged = mergeObservations(catalogue, observations);
console.log(JSON.stringify({
  mode: dryRun ? "dry-run" : "write",
  files: files.length,
  observations: observations.length,
  updated: merged.report.updated.length,
  unchanged: merged.report.unchanged.length,
  stale: merged.report.stale.length,
  candidates: merged.report.candidates.length,
  ...(verbose ? { report: merged.report } : {})
}, null, 2));
if (!dryRun) await writeFile(normalizedPath, `${JSON.stringify(merged.catalogue, null, 2)}\n`);
