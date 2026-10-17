import { describe, expect, it } from "vitest";
import {
  matchesPartFilters,
  partFilterTokens,
} from "../../wishlist-filters.js";

const item = {
  name: "Example",
  parts: [
    { name: "7-60", type: "ratchet" as const, owned: false },
    { name: "LR", type: "bit" as const, owned: true },
  ],
};

describe("wishlist part filters", () => {
  it("normalizes comma-separated tokens", () => {
    expect(partFilterTokens(" LR, 7-60, LR ")).toEqual(["lr", "7-60"]);
  });

  it("supports any, all, type, and missing-only filters", () => {
    expect(matchesPartFilters(item, { requestedParts: ["lr"] })).toBe(true);
    expect(
      matchesPartFilters(item, {
        requestedParts: ["lr", "7-60"],
        matchAll: true,
      }),
    ).toBe(true);
    expect(
      matchesPartFilters(item, { requestedParts: ["lr"], onlyMissing: true }),
    ).toBe(false);
    expect(
      matchesPartFilters(item, { requestedParts: ["7-60"], partType: "bit" }),
    ).toBe(false);
    expect(
      matchesPartFilters(item, { partType: "ratchet", onlyMissing: true }),
    ).toBe(true);
  });
});
