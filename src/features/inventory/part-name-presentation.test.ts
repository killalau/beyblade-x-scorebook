import { describe, expect, it } from "vitest";

import { presentPartNames } from "./part-name-presentation";

describe("presentPartNames", () => {
  it("shows Hasbro English and Hong Kong Chinese by default", () => {
    expect(
      presentPartNames({
        category: "Blade",
        name: "Wizard Rod",
        names: {
          "en-US": "Wand Wizard",
          "en-JP": "Wizard Rod",
          "zh-TW": "魔導神杖",
          "zh-HK": "巫師幻棍",
        },
      }),
    ).toEqual({
      primary: "Wand Wizard",
      secondary: "巫師幻棍",
      alternates: [
        { label: "EN-JP (TT)", value: "Wizard Rod" },
        { label: "台灣中文", value: "魔導神杖" },
      ],
    });
  });

  it("falls back to the canonical name for TT-only and legacy rows", () => {
    expect(
      presentPartNames({
        category: "Blade",
        name: "Aero Pegasus",
        names: {
          "en-US": null,
          "en-JP": "Aero Pegasus",
          "zh-TW": "空力天馬",
          "zh-HK": "空氣天馬",
        },
      }).primary,
    ).toBe("Aero Pegasus");
    expect(presentPartNames({ category: "Bit", name: "Rush" }).primary).toBe(
      "Rush",
    );
  });

  it("omits unavailable regional names", () => {
    expect(
      presentPartNames({
        category: "Bit",
        name: "Low Flat",
        names: {
          "en-US": "Low Flat",
          "en-JP": "Low Flat",
          "zh-TW": null,
          "zh-HK": null,
        },
      }),
    ).toEqual({
      primary: "Low Flat",
      secondary: null,
      alternates: [{ label: "EN-JP (TT)", value: "Low Flat" }],
    });
  });
});
