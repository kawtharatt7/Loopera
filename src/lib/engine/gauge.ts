import type { Gauge } from "./types";

export type YarnWeight = "fingering" | "sport" | "dk" | "worsted" | "bulky" | "super_bulky";

export interface YarnPreset {
  weight: YarnWeight;
  label: string;
  hookMm: number;
  /** Approximate single-crochet gauge. Labelled approximate in the UI. */
  gauge: Gauge;
}

// Approximate amigurumi gauges (tight single crochet). Real gauges vary by yarn and hand.
export const YARN_PRESETS: readonly YarnPreset[] = [
  { weight: "fingering", label: "Fingering (1)", hookMm: 2.25, gauge: { stitchWidthCm: 0.4, rowHeightCm: 0.4 } },
  { weight: "sport", label: "Sport (2)", hookMm: 2.75, gauge: { stitchWidthCm: 0.48, rowHeightCm: 0.45 } },
  { weight: "dk", label: "DK (3)", hookMm: 3.5, gauge: { stitchWidthCm: 0.55, rowHeightCm: 0.5 } },
  { weight: "worsted", label: "Worsted (4)", hookMm: 4.0, gauge: { stitchWidthCm: 0.67, rowHeightCm: 0.6 } },
  { weight: "bulky", label: "Bulky (5)", hookMm: 6.0, gauge: { stitchWidthCm: 0.9, rowHeightCm: 0.85 } },
  { weight: "super_bulky", label: "Super bulky (6)", hookMm: 8.0, gauge: { stitchWidthCm: 1.2, rowHeightCm: 1.1 } },
];

export function presetFor(weight: YarnWeight): YarnPreset {
  const p = YARN_PRESETS.find((y) => y.weight === weight);
  if (!p) throw new Error(`Unknown yarn weight ${weight}`);
  return p;
}

/** Gauge from a measured swatch: stitches and rows per 10 cm. */
export function gaugeFromSwatch(stitchesPer10cm: number, rowsPer10cm: number): Gauge {
  if (stitchesPer10cm <= 0 || rowsPer10cm <= 0) throw new Error("Swatch counts must be positive");
  return { stitchWidthCm: 10 / stitchesPer10cm, rowHeightCm: 10 / rowsPer10cm };
}
