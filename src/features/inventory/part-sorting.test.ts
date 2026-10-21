import { describe, expect, it } from "vitest";

import type { InventoryPartDetail } from "@/domain/types";

import { sortInventoryParts } from "./part-sorting";

const parts: InventoryPartDetail[] = [
  {
    category: "Blade",
    name: "Third",
    line: "UX",
    abbrev: "10-60",
    type: "Stamina",
    qty: 2,
    source: "Zulu Set",
  },
  {
    category: "Blade",
    name: "First",
    line: "BX",
    abbrev: "2-60",
    type: "Attack",
    qty: 10,
    source: "Alpha Set",
  },
  {
    category: "Main Blade",
    name: "Second",
    line: "CX",
    abbrev: "7-60",
    type: "Balance",
    qty: 1,
    source: "Middle Set",
  },
  {
    category: "Blade",
    name: "Missing",
    line: "-",
    abbrev: "-",
    type: "-",
    source: "",
  },
];

describe("sortInventoryParts", () => {
  it.each([
    ["line", "ascending", ["First", "Second", "Third", "Missing"]],
    ["line", "descending", ["Third", "Second", "First", "Missing"]],
    ["name", "ascending", ["First", "Missing", "Second", "Third"]],
    ["name", "descending", ["Third", "Second", "Missing", "First"]],
    ["abbrev", "ascending", ["First", "Second", "Third", "Missing"]],
    ["abbrev", "descending", ["Third", "Second", "First", "Missing"]],
    ["type", "ascending", ["First", "Second", "Third", "Missing"]],
    ["type", "descending", ["Third", "Second", "First", "Missing"]],
    ["qty", "ascending", ["Second", "Third", "First", "Missing"]],
    ["qty", "descending", ["First", "Third", "Second", "Missing"]],
  ] as const)("sorts %s %s", (key, direction, names) => {
    expect(
      sortInventoryParts(parts, { key, direction }).map((part) => part.name),
    ).toEqual(names);
  });

  it("preserves the current order until a sort is selected", () => {
    expect(sortInventoryParts(parts, null)).toBe(parts);
  });
});
