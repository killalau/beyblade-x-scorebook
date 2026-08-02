import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { auditNormalized } from "./normalized-audit.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const path = `${root}/data/normalized/retailer-listings.local.json`;
const dryRun = process.argv.includes("--dry-run");
const data = JSON.parse(await readFile(path, "utf8"));
const audit = auditNormalized(data);
const gates = new Map();
for (const issue of audit.issues) {
  if (issue.code === "suspicious_listing") gates.set(issue.listingId, { status: "rejected", reason: issue.detail });
  else if (issue.code === "incomplete_configs" && !gates.has(issue.listingId)) gates.set(issue.listingId, { status: "needs_review", reason: issue.detail });
}
let changed = 0;
for (const item of data.items) {
  const gate = gates.get(item.listingId);
  if (!gate || (item.normalizationStatus === gate.status && item.exclusionReason === gate.reason)) continue;
  item.normalizationStatus = gate.status;
  item.exclusionReason = gate.reason;
  if (gate.status === "rejected") item.orderable = false;
  changed += 1;
}
console.log(JSON.stringify({ mode: dryRun ? "dry-run" : "write", changed, rejected: [...gates.values()].filter((x) => x.status === "rejected").length, needsReview: [...gates.values()].filter((x) => x.status === "needs_review").length }, null, 2));
if (!dryRun) await writeFile(path, `${JSON.stringify(data, null, 2)}\n`);
