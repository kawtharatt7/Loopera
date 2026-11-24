import { describe, expect, it } from "vitest";
import { generatePattern, presetFor } from "@/lib/engine";
import { parseDesign } from "./design";

const bag = {
  title: { en: "Blue daisy bag", ar: "شنطة زرقاء بزهرة" },
  heightCm: 22,
  spec: {
    category: "amigurumi",
    confidence: 0.8,
    overallHeightRatio: 1.3,
    notes: "Beaded strand and daisy charm are added after.",
    parts: [
      { id: "Body", name: "Body", shape: "cylinder", dims: { width: 1, height: 0.8, depth: 0.6 }, colorHex: "#5e7894", quantity: 1, attachTo: null, position: { x: 0, y: 0, z: 0 } },
      { id: "handle", name: "Handle", shape: "capsule", dims: { width: 0.08, height: 0.6, depth: 0.08 }, colorHex: "#5E7894", quantity: 1, attachTo: "body", position: { x: 0, y: 1, z: 0 } },
      { id: "ghost", name: "Ghost", shape: "sphere", dims: { width: 0.2, height: 0.2, depth: 0.2 }, colorHex: "red", quantity: 0, attachTo: "nowhere", position: { x: 4, y: 0, z: 0 } },
    ],
  },
};

describe("AI design answers", () => {
  it("repairs small mistakes and validates", () => {
    const d = parseDesign(bag)!;
    expect(d).not.toBeNull();
    expect(d.spec.parts.map((p) => p.id)).toEqual(["body", "handle", "ghost"]);
    expect(d.spec.parts[0].colorHex).toBe("#5E7894");
    expect(d.spec.parts[2]).toMatchObject({ attachTo: null, quantity: 1, colorHex: "#C9785C", position: { x: 1, y: 0, z: 0 } });
  });

  it("becomes a full, checked pattern through the engine", () => {
    const d = parseDesign(bag)!;
    const pattern = generatePattern(d.spec, d.heightCm, presetFor("worsted").gauge);
    expect(pattern.parts.length).toBeGreaterThanOrEqual(2);
    expect(pattern.parts.every((p) => p.rounds.length > 0)).toBe(true);
  });

  it("rejects answers with no parts", () => {
    expect(parseDesign({ title: { en: "x", ar: "x" }, heightCm: 10, spec: { category: "flat", confidence: 1, overallHeightRatio: 1, notes: "", parts: [] } })).toBeNull();
  });
});
