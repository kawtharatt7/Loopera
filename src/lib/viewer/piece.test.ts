import { describe, expect, it } from "vitest";
import { TEMPLATES } from "@/lib/creator/templates";
import { generatePattern, presetFor, scaleSpec } from "@/lib/engine";
import type { DesignSpec } from "@/lib/spec/schema";
import { buildPiece, gridOf, PIECE_MAX_STITCHES } from "./piece";

const g = presetFor("worsted").gauge;
const build = (spec: DesignSpec, h: number, make: Parameters<typeof buildPiece>[2]) => buildPiece(generatePattern(spec, h, g), scaleSpec(spec, h), make, g.rowHeightCm, g.stitchWidthCm);

describe("the forming piece", () => {
  it("builds every template, in order, within the stitch budget", () => {
    for (const t of TEMPLATES) {
      const pc = build(t.spec, t.heights[1], t.type);
      expect(pc.stitches.length).toBeGreaterThan(50);
      expect(pc.stitches.length).toBeLessThanOrEqual(PIECE_MAX_STITCHES);
      for (let i = 1; i < pc.stitches.length; i++) expect(pc.stitches[i].at).toBeGreaterThanOrEqual(pc.stitches[i - 1].at);
      expect(pc.stitches.every((s) => s.p.every(Number.isFinite))).toBe(true);
    }
  });

  it("hangs a bag's handle above an open body", () => {
    const spec: DesignSpec = {
      category: "amigurumi",
      confidence: 1,
      overallHeightRatio: 1.4,
      notes: "",
      parts: [
        { id: "body", name: "Body", shape: "basket", dims: { width: 1, height: 0.75, depth: 0.5 }, colorHex: "#5E7894", quantity: 1, attachTo: null, position: { x: 0, y: 0, z: 0 } },
        { id: "handle", name: "Handle", shape: "rectangle", dims: { width: 0.09, height: 1.1, depth: 0.05 }, colorHex: "#5E7894", quantity: 1, attachTo: "body", position: { x: 0.55, y: 1, z: 0 } },
      ],
    };
    const pc = build(spec, 22, "bag");
    const top = Math.max(...pc.stitches.filter((s) => s.color === "#5E7894").map((s) => s.p[1]));
    const body = pc.bodies.find((b) => b.profile.length)!;
    expect(body.open).toBe(true);
    expect(top).toBeGreaterThan(body.origin[1] + Math.max(...body.profile.map(([, y]) => y)) + 3);
  });

  it("tiles squares with no gaps when it can", () => {
    expect(gridOf(3)).toEqual({ cols: 3, rows: 1 });
    expect(gridOf(4)).toEqual({ cols: 2, rows: 2 });
    expect(gridOf(6)).toEqual({ cols: 3, rows: 2 });
  });
});
