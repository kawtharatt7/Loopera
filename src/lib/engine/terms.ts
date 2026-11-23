export type Terms = "us" | "uk";

/** US stitch names to UK stitch names. US sc = UK dc, US dc = UK tr. */
const US_TO_UK: Record<string, string> = { sc: "dc", dc: "tr" };

/** Converts an instruction written in US terms to UK terms. */
export function toTerms(text: string, terms: Terms): string {
  if (terms === "us") return text;
  return text.replace(/\b(sc|dc)\b/g, (m) => US_TO_UK[m] ?? m);
}

export const ABBREVIATIONS: Record<Terms, { abbr: string; meaning: string }[]> = {
  us: [
    { abbr: "MR", meaning: "magic ring" },
    { abbr: "ch", meaning: "chain" },
    { abbr: "sl st", meaning: "slip stitch" },
    { abbr: "sc", meaning: "single crochet" },
    { abbr: "dc", meaning: "double crochet" },
    { abbr: "inc", meaning: "2 sc in the same stitch" },
    { abbr: "dec", meaning: "single crochet 2 together" },
    { abbr: "st / sp", meaning: "stitch / space" },
    { abbr: "(…) xN", meaning: "repeat the brackets N times" },
  ],
  uk: [
    { abbr: "MR", meaning: "magic ring" },
    { abbr: "ch", meaning: "chain" },
    { abbr: "sl st", meaning: "slip stitch" },
    { abbr: "dc", meaning: "double crochet (US single crochet)" },
    { abbr: "tr", meaning: "treble crochet (US double crochet)" },
    { abbr: "inc", meaning: "2 dc in the same stitch" },
    { abbr: "dec", meaning: "double crochet 2 together" },
    { abbr: "st / sp", meaning: "stitch / space" },
    { abbr: "(…) xN", meaning: "repeat the brackets N times" },
  ],
};
