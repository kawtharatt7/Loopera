import { describe, expect, it } from "vitest";
import { bandNormals, createThread, damp, seeded, stepThread, strandPoints } from "./yarn";

describe("yarn ball helpers", () => {
  it("keeps strand points on their shell", () => {
    const rand = seeded(1);
    for (const p of strandPoints(rand, 1, 40, [0, 1, 0], 1.1)) {
      expect(Math.hypot(...p)).toBeCloseTo(1.1, 6);
    }
  });

  it("spreads band axes over the whole sphere", () => {
    const n = bandNormals(seeded(2), 10, 1, 0);
    const ys = n.map((v) => v[1]);
    expect(Math.max(...ys)).toBeGreaterThan(0.8);
    expect(Math.min(...ys)).toBeLessThan(-0.8);
  });

  it("keeps thread segments near their rest length and pinned to the anchor", () => {
    const t = createThread([0, 0, 0], [1, 0, 0], 12, 0.1);
    for (let i = 0; i < 300; i++) {
      stepThread(t, [0.2, 0.1, 0], 1 / 60, { gravity: 3, damping: 0.96, wind: [0.5, 0, 0], iterations: 8 });
    }
    expect([t.pos[0], t.pos[1], t.pos[2]]).toEqual([0.2, expect.closeTo(0.1, 5), 0]);
    for (let i = 0; i < t.count - 1; i++) {
      const d = Math.hypot(t.pos[i * 3 + 3] - t.pos[i * 3], t.pos[i * 3 + 4] - t.pos[i * 3 + 1], t.pos[i * 3 + 5] - t.pos[i * 3 + 2]);
      expect(d).toBeGreaterThan(0.08);
      expect(d).toBeLessThan(0.12);
    }
    expect(Number.isFinite(t.pos[t.pos.length - 1])).toBe(true);
  });

  it("damps toward the target without overshoot", () => {
    expect(damp(0, 1, 3, 1 / 60)).toBeGreaterThan(0);
    expect(damp(0, 1, 3, 1 / 60)).toBeLessThan(1);
  });
});
