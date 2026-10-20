import { describe, expect, it } from "vitest";
import {
  canonicalInventoryPartCategory,
  groupInventoryParts,
  inventoryLinesByBladeCategory,
  inventoryPartCategories,
} from "../../inventory-parts.js";
import {
  findPurchaseForInventoryBey,
  normalizeInventoryProductName,
} from "../../inventory-products.js";

describe("inventory parts", () => {
  it("groups per-source rows without double-counting legacy summaries", () => {
    const grouped = groupInventoryParts([
      {
        category: "Assist Blade",
        name: "Turn",
        abbrev: "T",
        qty: 1,
        source: "Fang Leon",
      },
      {
        category: "Assist Blade",
        name: "Turn",
        abbrev: "T",
        qty: 2,
        source: "Fang Leon; Reaper Incendio",
      },
    ]);
    expect(grouped[0]).toMatchObject({
      qty: 2,
      source: "Fang Leon; Reaper Incendio",
    });
  });

  it("adds separate owned rows that share the same source", () => {
    const grouped = groupInventoryParts([
      {
        category: "Launcher",
        name: "Entry Launcher",
        qty: 1,
        source: "Glory Valkerion LF",
      },
      {
        category: "Launcher",
        name: "Entry Launcher",
        qty: 1,
        source: "Glory Valkerion LF",
      },
    ]);

    expect(grouped[0]).toMatchObject({
      qty: 2,
      source: "Glory Valkerion LF",
    });
  });

  it("preserves category and blade-line rules", () => {
    expect(canonicalInventoryPartCategory("Metal Blade")).toBe("Main Blade");
    expect(inventoryPartCategories).toContain("Battle Pass");
    expect(inventoryPartCategories).not.toContain("Other");
    expect(inventoryLinesByBladeCategory).toEqual({
      Blade: ["BX", "UX"],
      "Main Blade": ["CX"],
    });
  });
});

describe("inventory product matching", () => {
  it("normalizes bundle words and quantity suffixes", () => {
    expect(normalizeInventoryProductName("Shark Scale 4-50UF (x2)")).toBe(
      normalizeInventoryProductName("Shark Scale 4-50UF (x3)"),
    );
    expect(normalizeInventoryProductName("Shark Scale 4-50UF Starter")).toBe(
      normalizeInventoryProductName("Shark Scale 4-50UF"),
    );
  });

  it("prefers a purchase with remaining owned quantity", () => {
    const match = findPurchaseForInventoryBey(
      [
        {
          name: "Glory Valkerion LF",
          source: "Toy Snowman",
          soldItems: [{ salePrice: 40 }],
        },
        {
          name: "Glory Valkerion LF",
          source: "Walmart",
          estimatedTotalPaid: 22.36,
        },
      ],
      "Glory Valkerion LF",
    );
    expect(match?.source).toBe("Walmart");
  });
});
