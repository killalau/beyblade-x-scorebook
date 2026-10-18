import { describe, expect, it } from "vitest";

import {
  compareCatalogueItems,
  matchesCatalogueSearch,
} from "../../features/catalogue/catalogue-domain";
import { compareWishlistItems } from "../../features/wishlist/wishlist-domain";
import type { RetailerListing, WishlistItem } from "../types";

const listing = (overrides: Partial<RetailerListing>): RetailerListing => ({
  listingId: "shop:1",
  retailer: "Shop",
  name: "Example",
  url: "https://example.com",
  configs: ["Example 3-60R"],
  availabilityStatus: "available_now",
  orderable: true,
  ...overrides,
});

describe("catalogue helpers", () => {
  it("places missing prices and dates last", () => {
    const priced = listing({
      listingId: "priced",
      price: 20,
      lastSeenAt: "2026-10-17T00:00:00Z",
    });
    const missing = listing({ listingId: "missing" });
    expect(compareCatalogueItems(priced, missing, "priceAsc")).toBeLessThan(0);
    expect(compareCatalogueItems(priced, missing, "recent")).toBeLessThan(0);
  });

  it("uses the documented availability order and searchable configs", () => {
    const delayed = listing({ availabilityStatus: "delayed" });
    const unavailable = listing({ availabilityStatus: "unavailable" });
    expect(
      compareCatalogueItems(delayed, unavailable, "availability"),
    ).toBeLessThan(0);
    expect(matchesCatalogueSearch(delayed, "3-60r")).toBe(true);
  });
});

describe("wishlist sorting", () => {
  const item = (overrides: Partial<WishlistItem>): WishlistItem => ({
    name: "Example",
    ...overrides,
  });

  it("sorts scores descending and positive prices ascending", () => {
    expect(
      compareWishlistItems(item({ score: 10 }), item({ score: 4 }), "score"),
    ).toBeLessThan(0);
    expect(
      compareWishlistItems(item({ price: 20 }), item({ price: 0 }), "price"),
    ).toBeLessThan(0);
  });

  it("sorts newest valid dates first", () => {
    expect(
      compareWishlistItems(
        item({ createdAt: "2026-10-17T00:00:00Z" }),
        item({ createdAt: "2026-10-01T00:00:00Z" }),
        "createdAt",
      ),
    ).toBeLessThan(0);
  });
});
