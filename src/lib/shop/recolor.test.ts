import { describe, expect, it } from "vitest";
import { labToRgb, recolorPixels, rgbToLab } from "./recolor";

describe("recolor", () => {
  it("Lab round-trips", () => {
    for (const [r, g, b] of [[0, 0, 0], [255, 255, 255], [142, 21, 35], [79, 100, 103], [216, 196, 110]] as const) {
      const [L, a, bb] = rgbToLab(r, g, b);
      const back = labToRgb(L, a, bb);
      expect(Math.abs(back[0] - r) + Math.abs(back[1] - g) + Math.abs(back[2] - b)).toBeLessThanOrEqual(3);
    }
  });

  it("repaints the piece color and leaves other colors alone", () => {
    // pixel 1: the piece (yellow), pixel 2: skin, pixel 3: the piece but outside the mask
    const data = new Uint8ClampedArray([216, 196, 110, 255, 224, 172, 150, 255, 216, 196, 110, 255]);
    const mask = new Uint8ClampedArray([255, 255, 0]);
    recolorPixels(data, mask, "#D8C46E", "#8E1523");
    const [, a1] = rgbToLab(data[0], data[1], data[2]);
    expect(a1).toBeGreaterThan(30); // now red
    expect([data[4], data[5], data[6]]).toEqual([224, 172, 150]); // skin unchanged
    expect([data[8], data[9], data[10]]).toEqual([216, 196, 110]); // outside the mask unchanged
  });
});
