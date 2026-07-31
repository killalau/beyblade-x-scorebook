import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { scoreProduct } from "../src/scoring.js";

const keel = scoreProduct({
  name: "Keel Shark 3-60LF Booster",
  configs: ["Keel Shark 3-60LF"],
  price: 12.99
});
assert.equal(keel.score, 4);

const dual = scoreProduct(
  {
    name: "Gill Shark 4-70O, Pearl Tiger 3-60U Dual Pack",
    configs: ["Gill Shark 4-70O", "Pearl Tiger 3-60U"],
    price: 22.98
  },
  { ownedParts: ["3-60", "U"], rareParts: ["Gill Shark"] }
);
assert.equal(dual.score, 6);
assert.equal(dual.costIndex, null);

const rage = scoreProduct({
  name: "Rage Ragna FE4-55Y",
  configs: ["Rage Ragna FE4-55Y"],
  price: 19.99
}, {
  cxMode: true
});
assert.equal(rage.parts.find((part) => part.name === "Rage").partScore, 4.5);

const normalRage = scoreProduct({
  name: "Rage Ragna FE4-55Y",
  configs: ["Rage Ragna FE4-55Y"],
  price: 19.99
});
assert.equal(normalRage.parts.some((part) => part.type === "overBlade"), false);
assert.equal(normalRage.parts.some((part) => part.type === "assistBlade"), false);

const antlerCx = scoreProduct({
  name: "Antler Stag B 2-60HN",
  configs: ["Antler Stag B 2-60HN"],
  price: 19.99
}, {
  cxMode: true
});
assert.equal(antlerCx.parts.some((part) => part.type === "assistBlade" && part.name === "B"), true);

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
assert.match(html, /id="productRows"/);
assert.match(html, /id="addProductRow"/);

checkRelativeImports(resolve(new URL("..", import.meta.url).pathname), ["src", "scripts"]);

console.log("Smoke tests passed");

function checkRelativeImports(projectRoot, folders) {
  const sourceFiles = folders.flatMap((folder) => listJsFiles(join(projectRoot, folder)));
  const importPattern = /(?:import|export)\s+(?:[^'"]+\s+from\s+)?["'](\.{1,2}\/[^"']+)["']/g;

  for (const file of sourceFiles) {
    const source = readFileSync(file, "utf8");
    for (const match of source.matchAll(importPattern)) {
      const target = resolve(dirname(file), match[1]);
      assert.ok(
        resolvesAsModule(target),
        `Missing relative import target from ${file}: ${match[1]}`
      );
    }
  }
}

function listJsFiles(path) {
  if (!existsSync(path)) return [];
  const stats = statSync(path);
  if (stats.isFile()) return extname(path) === ".js" || extname(path) === ".mjs" ? [path] : [];
  return readdirSync(path)
    .flatMap((entry) => listJsFiles(join(path, entry)));
}

function resolvesAsModule(target) {
  return existsSync(target) || existsSync(`${target}.js`) || existsSync(`${target}.mjs`) || existsSync(join(target, "index.js"));
}
