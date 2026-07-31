import assert from "node:assert/strict";
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
});
assert.equal(rage.parts.find((part) => part.name === "Rage").partScore, 4.5);

console.log("Smoke tests passed");
