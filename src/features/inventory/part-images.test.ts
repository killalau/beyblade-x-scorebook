import { describe, expect, it } from "vitest";

import { inventoryPartImageRefs } from "./part-images";

describe("inventory part images", () => {
  it("resolves an exact Hasbro colour variant from its release id", () => {
    expect(
      inventoryPartImageRefs({
        category: "Blade",
        name: "Glory Valkerion",
        code: "G4568",
      }),
    ).toEqual([
      expect.objectContaining({
        releaseId: "G4568",
        variant: "exact",
        url: expect.stringContaining("HB-G4568-BLADE.webp"),
      }),
    ]);
  });

  it("keeps unknown random-booster colours explicit", () => {
    const refs = inventoryPartImageRefs({
      category: "Lock Chip",
      name: "Croco",
      source: "Croco Tread TQ5-50GN",
    });

    expect(refs).toHaveLength(3);
    expect(refs.every((ref) => ref.variant === "unknown")).toBe(true);
  });

  it("resolves an exact TT random-booster colour from its release code", () => {
    expect(
      inventoryPartImageRefs({
        category: "Main Blade",
        name: "Whip",
        code: "CX-18-02",
        source: "Brachio Whip OW5-70Nr",
      }),
    ).toEqual([
      expect.objectContaining({
        releaseId: "096177-02",
        variant: "exact",
        url: expect.stringContaining("MB-PRD-096177-02.webp"),
      }),
    ]);
  });

  it.each([
    ["Lock Chip", "Emperor", "G3028-03", "LOCKCHIP"],
    ["Blade", "Rock Golem", "G3028-01", "BLADE"],
    ["Blade", "Gill Shark", "G3028-02", "BLADE"],
  ] as const)(
    "keeps the exact multipack child id for %s %s",
    (category, name, code, suffix) => {
      expect(inventoryPartImageRefs({ category, name, code })[0]).toEqual(
        expect.objectContaining({
          releaseId: code,
          url: expect.stringContaining(`HB-${code}-${suffix}.webp`),
        }),
      );
    },
  );

  it("maps Infinity metal blades stored in the Main Blade UI category", () => {
    expect(
      inventoryPartImageRefs({
        category: "Main Blade",
        name: "Hurricane",
        code: "G2750",
      })[0],
    ).toEqual(
      expect.objectContaining({
        releaseId: "G2750",
        url: expect.stringContaining("HB-G2750-METALBLADE.webp"),
      }),
    );
  });

  it("uses the verified product image when no isolated launcher image exists", () => {
    expect(
      inventoryPartImageRefs({
        category: "Launcher",
        name: "Right-spin Winder Launcher",
        code: "G4569",
      })[0],
    ).toEqual(
      expect.objectContaining({
        releaseId: "G4569",
        url: expect.stringContaining("hasbro/G4569/G4569_00.webp"),
      }),
    );
  });

  it("uses the exact product half for battle-set parts", () => {
    expect(
      inventoryPartImageRefs({
        category: "Bit",
        name: "Rush",
        abbrev: "R",
        source: "Xtreme Battle Set",
      })[0],
    ).toEqual(
      expect.objectContaining({
        releaseId: "F9588-01",
        url: expect.stringContaining("HB-F9588-01-BIT.webp"),
      }),
    );
  });
});
