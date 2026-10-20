import { describe, expect, it } from "vitest";

import { summarizeSources } from "./source-summary";

describe("summarizeSources", () => {
  it("shows up to three sources in full", () => {
    expect(summarizeSources("One; Two; Three")).toEqual({
      display: "One; Two; Three",
      full: "One; Two; Three",
      truncated: false,
    });
  });

  it("shows the first three sources and keeps the full list for a tooltip", () => {
    expect(summarizeSources("One; Two; Three; Four; Five")).toEqual({
      display: "One; Two; Three; ...",
      full: "One; Two; Three; Four; Five",
      truncated: true,
    });
  });

  it("normalizes whitespace and handles a missing source", () => {
    expect(summarizeSources(" One ;  Two ")).toEqual({
      display: "One; Two",
      full: "One; Two",
      truncated: false,
    });
    expect(summarizeSources(undefined)).toEqual({
      display: "-",
      full: "-",
      truncated: false,
    });
  });
});
