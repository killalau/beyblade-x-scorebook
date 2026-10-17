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
      inventory: { parts: ["R"], beys: ["Example 3-60R"], custom: true },
      purchases: { items: [{ name: "Example", recordedFrom: "test" }] },
    });
    expect(result.inventory.custom).toBe(true);
    expect(result.purchases.items[0].recordedFrom).toBe("test");
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
