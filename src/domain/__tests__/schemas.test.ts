import { describe, expect, it } from "vitest";

import {
  collectionSchema,
  publicCatalogueSchema,
  wishlistSchema,
} from "../../schemas/data-schemas";

describe("runtime data contracts", () => {
  it("accepts a version-one collection and retains extension fields", () => {
    const result = collectionSchema.parse({
      version: 1,
      currency: "CAD",
      sourcePreferences: {
        market: "Canada",
        defaultBrand: "Hasbro",
        explicitTakaraTomyProducts: ["Aero Pegasus"],
      },
      inventory: {
        parts: ["R"],
        beys: ["Example 3-60R"],
        partsDetail: [
          {
            category: "Bit",
            name: "Rush",
            names: {
              "en-US": "Rush",
              "en-JP": "Rush",
              "zh-TW": null,
              "zh-HK": null,
            },
            brand: "Hasbro",
          },
        ],
        custom: true,
      },
      purchases: {
        items: [{ name: "Example", brand: "Hasbro", recordedFrom: "test" }],
      },
    });
    expect(result.inventory.custom).toBe(true);
    expect(result.purchases.items[0].recordedFrom).toBe("test");
    expect(result.purchases.items[0].brand).toBe("Hasbro");
    expect(result.inventory.partsDetail?.[0].brand).toBe("Hasbro");
    expect(result.inventory.partsDetail?.[0].names?.["zh-TW"]).toBeNull();
    expect(result.sourcePreferences?.defaultBrand).toBe("Hasbro");
  });

  it("rejects malformed localized part names", () => {
    expect(() =>
      collectionSchema.parse({
        version: 1,
        inventory: {
          parts: [],
          beys: [],
          partsDetail: [
            {
              category: "Bit",
              name: "Rush",
              names: {
                "en-US": "Rush",
                "en-JP": "Rush",
                "zh-TW": 123,
                "zh-HK": "R",
              },
            },
          ],
        },
        purchases: { items: [] },
      }),
    ).toThrow();
  });

  it("rejects unsupported purchase and part brands", () => {
    expect(() =>
      collectionSchema.parse({
        version: 1,
        inventory: {
          parts: [],
          beys: [],
          partsDetail: [{ category: "Bit", name: "Rush", brand: "Unverified" }],
        },
        purchases: {
          items: [{ name: "Example", brand: "Unverified" }],
        },
      }),
    ).toThrow();
  });

  it("rejects unsupported Bit types", () => {
    expect(() =>
      collectionSchema.parse({
        version: 1,
        inventory: {
          parts: [],
          beys: [],
          partsDetail: [
            { category: "Bit", name: "Example", type: "Endurance" },
          ],
        },
        purchases: { items: [] },
      }),
    ).toThrow(/Bit type must be/);
  });

  it("validates trade acquisition references and transferred cost basis", () => {
    const collection = {
      version: 1 as const,
      inventory: { parts: [], beys: [] },
      purchases: {
        items: [
          {
            acquisitionId: "purchase-a",
            name: "Example A",
            brand: "Hasbro" as const,
          },
        ],
      },
      trades: {
        items: [
          {
            tradeId: "trade-a-for-b",
            tradedAt: "2026-10-21",
            gave: [
              {
                name: "Example A",
                fromAcquisitionId: "purchase-a",
                transferredCostBasis: 20,
              },
            ],
            received: [
              {
                acquisitionId: "trade-b",
                name: "Example B",
                brand: "Hasbro" as const,
                costBasis: 25,
                imageUrl: "https://example.com/example-b.jpg",
              },
            ],
            cashPaid: 5,
          },
        ],
      },
    };
    expect(collectionSchema.parse(collection).trades?.items).toHaveLength(1);
    expect(() =>
      collectionSchema.parse({
        ...collection,
        trades: {
          items: [
            {
              ...collection.trades.items[0],
              received: [
                {
                  acquisitionId: "trade-b",
                  name: "Example B",
                  brand: "Hasbro" as const,
                  costBasis: 20,
                  imageUrl: "https://example.com/example-b.jpg",
                },
              ],
            },
          ],
        },
      }),
    ).toThrow(/Received cost basis must equal/);
  });

  it("rejects unsupported versions and invalid inventory lines", () => {
    expect(() =>
      collectionSchema.parse({
        version: 2,
        inventory: { parts: [], beys: [] },
        purchases: { items: [] },
      }),
    ).toThrow();
    expect(() =>
      collectionSchema.parse({
        version: 1,
        inventory: {
          parts: [],
          beys: [],
          partsDetail: [{ category: "Bit", name: "Rush", line: "UX" }],
        },
        purchases: { items: [] },
      }),
    ).toThrow(/Line is only valid/);
  });

  it("accepts blade systems and rejects them on non-blade parts", () => {
    expect(
      collectionSchema.parse({
        version: 1,
        inventory: {
          parts: [],
          beys: [],
          partsDetail: [
            {
              category: "Blade",
              name: "Dran Strike",
              line: "BX",
              bladeSystem: "expand",
            },
          ],
        },
        purchases: { items: [] },
      }).inventory.partsDetail?.[0].bladeSystem,
    ).toBe("expand");
    expect(() =>
      collectionSchema.parse({
        version: 1,
        inventory: {
          parts: [],
          beys: [],
          partsDetail: [
            {
              category: "Bit",
              name: "Flat",
              bladeSystem: "expand",
            },
          ],
        },
        purchases: { items: [] },
      }),
    ).toThrow(/Blade system is only valid/);
  });

  it("accepts structured wishlist parts", () => {
    expect(
      wishlistSchema.parse({
        items: [
          {
            name: "Example",
            parts: [{ name: "R", type: "bit", owned: false }],
          },
        ],
      }).items,
    ).toHaveLength(1);
  });

  it("rejects private fields in the public catalogue", () => {
    expect(() =>
      publicCatalogueSchema.parse({
        version: 1,
        items: [
          {
            listingId: "shop:1",
            retailer: "Shop",
            name: "Example",
            url: "https://example.com",
            configs: ["Example 3-60R"],
            availabilityStatus: "available_now",
            orderable: true,
            notes: "private",
          },
        ],
      }),
    ).toThrow(/must not expose notes/);
  });
});
