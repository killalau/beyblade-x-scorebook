/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  mutate: [
    "src/scoring.js",
    "src/collection-summary.js",
    "src/inventory-parts.js",
    "src/inventory-products.js",
    "src/wishlist-filters.js",
  ],
  testRunner: "vitest",
  vitest: { configFile: "vitest.config.mts" },
  reporters: ["clear-text", "progress", "html"],
  coverageAnalysis: "perTest",
  thresholds: { high: 80, low: 60, break: 50 },
  tempDirName: ".stryker-tmp",
  cleanTempDir: true,
};
