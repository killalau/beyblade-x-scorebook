import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { auditNormalized } from "./normalized-audit.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const data = JSON.parse(await readFile(`${root}/data/normalized/retailer-listings.local.json`, "utf8"));
const report = auditNormalized(data);
const verbose = process.argv.includes("--verbose");
console.log(JSON.stringify({
  total: report.total,
  issueCount: report.issueCount,
  counts: report.counts,
  ...(verbose ? { issues: report.issues } : {})
}, null, 2));
