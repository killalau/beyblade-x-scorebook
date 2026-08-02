import { readdir, readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import { extractObservations, mergeObservations } from "./crawl-normalizer.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const rawDir = join(root, "data/raw");
const catalogue = JSON.parse(await readFile(join(root, "data/normalized/retailer-listings.local.json"), "utf8"));
const observations = [];
for (const file of (await readdir(rawDir)).filter((name) => name.endsWith(".json"))) {
  observations.push(...extractObservations(JSON.parse(await readFile(join(rawDir, file), "utf8")), basename(file)));
}
const candidates = mergeObservations(catalogue, observations).report.candidates;
console.log(JSON.stringify({ count: candidates.length, candidates }, null, 2));
