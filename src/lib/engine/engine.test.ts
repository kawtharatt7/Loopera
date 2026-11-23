import { describe, expect, it } from "vitest";
import { DesignSpecSchema } from "@/lib/spec/schema";
import { BALL_HEAD, BEAR_WITH_EARS, GRANNY_SQUARE } from "@/lib/spec/samples";
import { buildPart, estimate, generatePattern, gaugeFromSwatch, toTerms } from "./index";
import { buildRevolutionPart } from "./revolution";
import { runsToText, simulateRuns, transitionRuns } from "./spread";
import type { EnginePart, Gauge } from "./types";
import { parseInstruction, PatternValidationError, validatePart } from "./validate";

const G: Gauge = { stitchWidthCm: 0.5, rowHeightCm: 0.5 };

function part(over: Partial<EnginePart>): EnginePart {
  return {
    id: "p",
    name: "Part",
    shape: "sphere",
    widthCm: 5,
    heightCm: 5,
    depthCm: 5,
    colorHex: "#CE4F2F",
    quantity: 1,
    attachTo: null,
    position: { x: 0, y: 0, z: 0 },
    ...over,
  };
}

describe("required wording", () => {
  const text = (a: number, b: number) => runsToText(a, transitionRuns(a, b));
  it("matches the reference sphere wording", () => {
    expect(text(6, 12)).toBe("inc in each st");
    expect(text(12, 18)).toBe("(1 sc, inc) x6");
    expect(text(24, 30)).toBe("(3 sc, inc) x6");
    expect(text(30, 24)).toBe("(3 sc, dec) x6");
    expect(text(12, 6)).toBe("dec x6");
    expect(text(30, 30)).toBe("sc in each st");
  });

  it("splits uneven increases into groups that differ by at most one", () => {
    expect(text(22, 28)).toBe("(3 sc, inc) x4, (2 sc, inc) x2");
  });
});

describe("reference sphere", () => {
  it("goes 6, 12, 18, 24, 30, plain 30s, then 24, 18, 12, 6", () => {
    // Circumference 30 stitches at 0.5 cm: diameter = 30 * 0.5 / pi.
    const d = (30 * 0.5) / Math.PI;
    const p = buildRevolutionPart(part({ widthCm: d, depthCm: d, heightCm: 6 }), G);
    const counts = p.rounds.map((r) => r.stitches);
    expect(counts.slice(0, 5)).toEqual([6, 12, 18, 24, 30]);
    expect(counts.slice(-4)).toEqual([24, 18, 12, 6]);
    const middle = counts.slice(5, -4);
    expect(middle.length).toBeGreaterThan(0);
    expect(middle.every((c) => c === 30)).toBe(true);
    expect(p.rounds[0].instruction).toBe("6 sc in magic ring");
    expect(p.finish).toBe("Fasten off, stuff, and close.");
    expect(() => validatePart(p)).not.toThrow();
  });
});

describe("validator", () => {
  it("parses written instructions back to the same counts", () => {
    const runs = parseInstruction("(3 sc, inc) x4, (2 sc, inc) x2", 22);
    expect(simulateRuns(runs)).toEqual({ consumed: 22, produced: 28 });
  });

  it("throws when a round does not add up", () => {
    const p = buildRevolutionPart(part({}), G);
    const broken = { ...p, rounds: p.rounds.map((r, i) => (i === 2 ? { ...r, stitches: r.stitches + 1 } : r)) };
    expect(() => validatePart(broken)).toThrow(PatternValidationError);
  });

  it("throws when written text disagrees with the structured form", () => {
    const p = buildRevolutionPart(part({}), G);
    const broken = { ...p, rounds: p.rounds.map((r, i) => (i === 1 ? { ...r, instruction: "(2 sc, inc) x6" } : r)) };
    expect(() => validatePart(broken)).toThrow(PatternValidationError);
  });

  it("rejects illegal transitions", () => {
    expect(() => transitionRuns(6, 13)).toThrow();
    expect(() => transitionRuns(12, 5)).toThrow();
  });
});

describe("flat items", () => {
  it("builds a rectangle with a foundation chain and turning chains", () => {
    const p = buildPart(part({ shape: "rectangle", widthCm: 10, heightCm: 5 }), G);
    expect(p.rounds[0].instruction).toBe("ch 21, sc in 2nd ch from hook and in each ch across");
    expect(p.rounds).toHaveLength(10);
    expect(p.rounds.every((r) => r.stitches === 20)).toBe(true);
  });

  it("builds a granny square with 12r dc per round", () => {
    const p = buildPart(part({ shape: "granny_square", widthCm: 9, heightCm: 9 }), G);
    p.rounds.forEach((r) => expect(r.stitches).toBe(12 * r.number));
  });
});

describe("samples and DesignSpec", () => {
  it("validates and builds all three samples", () => {
    for (const spec of [BALL_HEAD, BEAR_WITH_EARS, GRANNY_SQUARE]) {
      expect(DesignSpecSchema.safeParse(spec).success).toBe(true);
      const pattern = generatePattern(spec, 12, G);
      expect(pattern.parts.length).toBe(spec.parts.length);
      const est = estimate(pattern, G);
      expect(est.totalMeters).toBeGreaterThan(0);
    }
  });

  it("writes assembly steps between rounds", () => {
    const pattern = generatePattern(BEAR_WITH_EARS, 15, G);
    expect(pattern.assembly.map((s) => s.partId)).toEqual(["head", "ear", "arm"]);
    expect(pattern.assembly[0].text).toMatch(/^Stuff firmly, then attach Head to Body between rounds \d+ and \d+, leaving a long tail\.$/);
  });

  it("rejects a spec that attaches to a missing part", () => {
    const bad = { ...BALL_HEAD, parts: [{ ...BALL_HEAD.parts[0], attachTo: "nope" }] };
    expect(DesignSpecSchema.safeParse(bad).success).toBe(false);
  });
});

describe("terms and gauge", () => {
  it("converts US to UK terms", () => {
    expect(toTerms("(3 sc, dec) x6", "uk")).toBe("(3 dc, dec) x6");
    expect(toTerms("3 dc in ring", "uk")).toBe("3 tr in ring");
  });
  it("derives gauge from a swatch", () => {
    expect(gaugeFromSwatch(20, 25)).toEqual({ stitchWidthCm: 0.5, rowHeightCm: 0.4 });
  });
});

// Property-based tests with a small seeded generator (no extra library).
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

describe("property: random profiles always validate", () => {
  const shapes = ["sphere", "ellipsoid", "cylinder", "cone", "capsule", "ear", "rectangle", "granny_square"] as const;
  it("builds 600 random parts without a single inconsistent round", () => {
    const rand = rng(42);
    for (let i = 0; i < 600; i++) {
      const shape = shapes[Math.floor(rand() * shapes.length)];
      const g: Gauge = { stitchWidthCm: 0.3 + rand() * 1.2, rowHeightCm: 0.3 + rand() * 1.2 };
      const p = part({
        shape,
        widthCm: 0.5 + rand() * 40,
        heightCm: 0.5 + rand() * 40,
        depthCm: 0.5 + rand() * 40,
        snapToSix: rand() < 0.5 ? undefined : rand() < 0.5,
      });
      const built = buildPart(p, g); // throws on any inconsistency
      for (let k = 1; k < built.rounds.length; k++) {
        if (built.kind !== "revolution") break;
        const prev = built.rounds[k - 1].stitches;
        const cur = built.rounds[k].stitches;
        expect(cur - prev).toBeLessThanOrEqual(prev);
        expect(prev - cur).toBeLessThanOrEqual(Math.floor(prev / 2));
      }
      if (built.kind === "revolution" && built.closed) {
        expect(built.rounds[built.rounds.length - 1].stitches).toBe(6);
      }
    }
  });
});
