import { describe, expect, it } from "vitest";
import { TAPESTRIES } from "@/lib/tapestry/designs";
import { chartFromPixels, kmeans, smoothSingles, type RGB } from "@/lib/tapestry/quantize";
import { rowText, runsOf, tapestryPattern, TapestryValidationError, validateTapestry } from "./tapestry";

describe("tapestry rows", () => {
  it("reads right-side rows right to left from the bottom", () => {
    const grid = [
      [0, 0, 1, 1],
      [2, 2, 2, 1],
    ];
    const p = tapestryPattern(grid, 3);
    expect(p.rows[0]).toMatchObject({ number: 1, side: "RS", runs: [{ color: 1, count: 1 }, { color: 2, count: 3 }] });
    expect(p.rows[1]).toMatchObject({ number: 2, side: "WS", runs: [{ color: 0, count: 2 }, { color: 1, count: 2 }] });
    expect(p.foundation).toBe(5);
    expect(rowText(p.rows[0], (i) => ["Cream", "Wine", "Gold"][i])).toBe("1 sc Wine, 3 sc Gold");
  });

  it("rejects a broken row", () => {
    const p = tapestryPattern([[0, 1, 1]], 2);
    p.rows[0].runs[0].count = 3;
    expect(() => validateTapestry(p)).toThrow(TapestryValidationError);
    expect(() => tapestryPattern([[0, 1], [0]], 2)).toThrow(TapestryValidationError);
  });

  it("every shop design validates and every row adds up", () => {
    for (const d of Object.values(TAPESTRIES)) {
      const p = tapestryPattern(d.grid, d.palette.length);
      expect(p.rows).toHaveLength(d.height);
      expect(p.stitchesByColor.reduce((a, b) => a + b, 0)).toBe(d.width * d.height);
    }
  });

  it("collapses runs", () => {
    expect(runsOf([3, 3, 1, 3])).toEqual([
      { color: 3, count: 2 },
      { color: 1, count: 1 },
      { color: 3, count: 1 },
    ]);
  });
});

describe("photo to chart", () => {
  it("finds the main colors and maps every pixel", () => {
    const red: RGB = [200, 30, 40];
    const cream: RGB = [240, 230, 210];
    const pixels: RGB[] = Array.from({ length: 100 }, (_, i) => (i % 10 < 5 ? red : cream));
    const { grid, palette } = chartFromPixels(pixels, 10, 10, 2);
    expect(palette).toHaveLength(2);
    expect(new Set(grid.flat()).size).toBe(2);
    expect(grid[0][0]).not.toBe(grid[0][9]);
    expect(kmeans([], 3)).toEqual([]);
  });

  it("removes lone single stitches", () => {
    expect(smoothSingles([[1, 0, 1, 1]])).toEqual([[1, 1, 1, 1]]);
  });
});
