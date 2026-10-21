import { describe, expect, it } from "vitest";
import {
  canonicalInventoryPartCategory,
  canonicalPartName,
  groupInventoryParts,
  inventoryLinesByBladeCategory,
  inventoryPartCategories,
  supportsRegionalChineseName,
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

  it("collects every localized name for search when rows are grouped", () => {
    const [grouped] = groupInventoryParts([
      {
        category: "Blade",
        line: "UX",
        name: "Wizard Rod",
        names: {
          "en-US": "Wand Wizard",
          "en-JP": "Wizard Rod",
          "zh-TW": "魔導神杖",
          "zh-HK": "巫師幻棍",
        },
        abbrev: "-",
        qty: 1,
        source: "Wand Wizard 5-70DB",
      },
    ]);

    expect(grouped.searchNames).toEqual(
      expect.arrayContaining([
        "Wand Wizard",
        "Wizard Rod",
        "魔導神杖",
        "巫師幻棍",
      ]),
    );
  });

  it("uses component identity instead of cosmetic release labels", () => {
    expect(canonicalPartName("Blitz Metallic Coat: Yellow", "MainBlade")).toBe(
      "Blitz",
    );
    expect(canonicalPartName("Rage Metallic Coat: Gold", "Main Blade")).toBe(
      "Rage",
    );
    expect(canonicalPartName("狂怒 金屬塗層:燦金", "Main Blade")).toBe("狂怒");
    expect(canonicalPartName("Fang Red Ver.", "Main Blade")).toBe("Fang");
    expect(canonicalPartName("O/Whip", "MainBlade")).toBe("Whip");
  });

  it("limits regional Chinese names to blade-family and lock-chip parts", () => {
    expect(supportsRegionalChineseName("Blade")).toBe(true);
    expect(supportsRegionalChineseName("Main Blade")).toBe(true);
    expect(supportsRegionalChineseName("Lock Chip")).toBe(true);
    expect(supportsRegionalChineseName("Assist Blade")).toBe(false);
    expect(supportsRegionalChineseName("Over Blade")).toBe(false);
    expect(supportsRegionalChineseName("Bit")).toBe(false);
    expect(supportsRegionalChineseName("Ratchet")).toBe(false);
  });

  it("groups alternate-colour releases under the same component", () => {
    const grouped = groupInventoryParts([
      {
        category: "Main Blade",
        line: "CX",
        name: "Rage",
        qty: 1,
        source: "Rage Ragna FE4-55Y",
      },
      {
        category: "Main Blade",
        line: "CX",
        name: "Rage",
        qty: 1,
        source: "Tiga Rage FT3-60T",
      },
    ]);

    expect(grouped).toHaveLength(1);
    expect(grouped[0]).toMatchObject({
      name: "Rage",
      qty: 2,
      source: "Rage Ragna FE4-55Y; Tiga Rage FT3-60T",
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
