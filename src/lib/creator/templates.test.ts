import { describe, expect, it } from "vitest";
import { generatePattern, presetFor } from "@/lib/engine";
import { DesignSpecSchema } from "@/lib/spec/schema";
import { colorFromText, heightFor, matchTapestry, matchTemplate, recolor, TEMPLATES } from "./templates";
import { riyadhDay } from "./daily";

describe("template matching", () => {
  it("understands Arabic and English", () => {
    expect(matchTemplate("toy", "دب بني صغير").key).toBe("bear");
    expect(matchTemplate("toy", "a pink bunny with long ears").key).toBe("bunny");
    expect(matchTemplate("toy", "قطة سوداء").key).toBe("cat");
    expect(matchTemplate("bag", "شنطة مربعات جراني ملونة").key).toBe("granny-bag");
    expect(matchTemplate("clothes", "كارديجان بني").key).toBe("cardigan");
    expect(matchTemplate("other", "بطانية للبيبي").key).toMatch(/blanket/);
    expect(matchTapestry("هلال ونجوم رمضان")).toBe("crescent-night");
    expect(matchTapestry("desert dunes")).toBe("dunes-at-noon");
  });

  it("reads color words", () => {
    expect(colorFromText("دب بني")).toBe("#7A4E36");
    expect(colorFromText("a blue whale")).toBe("#4F7CAC");
    expect(colorFromText("something")).toBeNull();
  });

  it("every template is a valid spec and builds a validated pattern at every size", () => {
    const gauge = presetFor("worsted").gauge;
    for (const t of TEMPLATES) {
      expect(DesignSpecSchema.safeParse(t.spec).success).toBe(true);
      for (const size of ["small", "medium", "large"] as const) {
        const p = generatePattern(recolor(t.spec, ["#123456", "#654321"]), heightFor(t, size), gauge);
        expect(p.parts.length).toBe(t.spec.parts.length);
      }
    }
  });

  it("knows the Riyadh day", () => {
    // 22:30 UTC on 23 Nov is already 24 Nov in Riyadh (UTC+3)
    expect(riyadhDay(new Date("2026-11-23T22:30:00Z"))).toBe("2026-11-24");
  });
});
