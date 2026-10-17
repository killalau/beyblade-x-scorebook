import { describe, expect, it } from "vitest";
import { parseConfig, scoreProduct } from "../../scoring.js";

describe("scoring parity", () => {
  it("scores a representative BX product", () => {
    expect(
      scoreProduct({
        name: "Keel Shark 3-60LF Booster",
        configs: ["Keel Shark 3-60LF"],
        price: 12.99,
      }).score,
    ).toBe(4);
  });

  it("parses CX Expand parts", () => {
    expect(
      parseConfig("Blitz Bahamut BK 1-50I", { cxMode: true }).map(
        (part) => part.name,
      ),
    ).toEqual(["Blitz", "Bahamut", "Break", "Knuckle", "1-50", "I"]);
  });

  it("parses integrated fused bits", () => {
    expect(
      parseConfig("Blast Pegasus A Tr", { cxMode: true }).map(
        (part) => part.name,
      ),
    ).toEqual(["Blast", "Pegasus", "A", "Tr"]);
  });

  it("applies owned parts to Cost Index without changing score", () => {
    const result = scoreProduct(
      {
        name: "Gill Shark 4-70O, Pearl Tiger 3-60U Dual Pack",
        configs: ["Gill Shark 4-70O", "Pearl Tiger 3-60U"],
        price: 22.98,
      },
      { ownedParts: ["3-60", "U"], rareParts: ["Gill Shark"] },
    );
    expect(result.score).toBe(6);
    expect(result.costIndex).toBeNull();
  });
});
