import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { relative, resolve } from "node:path";

const projectRoot = resolve(new URL("..", import.meta.url).pathname);
const distRoot = resolve(projectRoot, "dist");

assert.ok(
  existsSync(distRoot),
  "Expected a production build in dist/. Run npm run build first.",
);

const files = listFiles(distRoot).map((file) => relative(distRoot, file));
const forbiddenPaths = [
  /(^|\/)raw(\/|$)/i,
  /(^|\/)normalized(\/|$)/i,
  /\.local\.json$/i,
  /(^|\/)collection[^/]*\.json$/i,
  /(^|\/)wishlist[^/]*\.json$/i,
  /\.xlsx$/i,
];

for (const file of files) {
  assert.equal(
    forbiddenPaths.some((pattern) => pattern.test(file)),
    false,
    `Private or disallowed file found in public build: ${file}`,
  );
}

const publicCatalogue = resolve(distRoot, "data/retailer-listings.json");
assert.ok(
  existsSync(publicCatalogue),
  "Public Catalogue snapshot is missing from dist/data/.",
);
const catalogue = JSON.parse(readFileSync(publicCatalogue, "utf8"));
assert.ok(
  Array.isArray(catalogue.items),
  "Public Catalogue build asset must contain an items array.",
);

console.log(`Public build privacy check passed (${files.length} files).`);

function listFiles(path) {
  const stats = statSync(path);
  if (stats.isFile()) return [path];
  return readdirSync(path).flatMap((entry) => listFiles(resolve(path, entry)));
}
