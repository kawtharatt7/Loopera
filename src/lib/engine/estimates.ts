import type { Gauge, Pattern } from "./types";

// All estimate constants live here. Every number is approximate and labelled so in the UI.
export const ESTIMATE_CONSTANTS = {
  /** Yarn used per single crochet, as a multiple of the stitch width. */
  yarnPerStitchWidths: 6.5,
  /** Extra yarn for tails, joins and sewing, as a fraction of the total. */
  wasteFactor: 0.15,
  /** Average seconds to work one stitch. */
  secondsPerStitch: 4,
  /** Minutes per part for finishing and assembly. */
  assemblyMinutesPerPart: 8,
} as const;

export interface ColorEstimate {
  colorHex: string;
  meters: number;
}

export interface Estimates {
  yarnByColor: ColorEstimate[];
  totalMeters: number;
  minutes: number;
}

export function estimate(pattern: Pattern, gauge: Gauge): Estimates {
  const byColor = new Map<string, number>();
  let stitches = 0;
  let partCount = 0;
  for (const part of pattern.parts) {
    const s = part.totalStitches * part.quantity;
    stitches += s;
    partCount += part.quantity;
    const cm = s * gauge.stitchWidthCm * ESTIMATE_CONSTANTS.yarnPerStitchWidths * (1 + ESTIMATE_CONSTANTS.wasteFactor);
    const key = part.colorHex.toUpperCase();
    byColor.set(key, (byColor.get(key) ?? 0) + cm / 100);
  }
  const yarnByColor = [...byColor.entries()].map(([colorHex, meters]) => ({
    colorHex,
    meters: Math.ceil(meters),
  }));
  return {
    yarnByColor,
    totalMeters: yarnByColor.reduce((a, c) => a + c.meters, 0),
    minutes: Math.round((stitches * ESTIMATE_CONSTANTS.secondsPerStitch) / 60 + partCount * ESTIMATE_CONSTANTS.assemblyMinutesPerPart),
  };
}
