// Matches what someone asked for (type + words in Arabic or English) to a pattern template.
// Templates are DesignSpecs the engine turns into exact, validated rounds. Pure and tested.
import type { Bi } from "@/lib/i18n/config";
import type { DesignSpec, PartSpec } from "@/lib/spec/schema";
import { BALL_HEAD, BEAR_WITH_EARS } from "@/lib/spec/samples";
import { TAPESTRIES, type TapestryId } from "@/lib/tapestry/designs";

export type MakeType = "toy" | "bag" | "clothes" | "wall" | "flat" | "other";
export type SizeChoice = "small" | "medium" | "large";

export interface Template {
  key: string;
  type: Exclude<MakeType, "wall" | "other">;
  name: Bi;
  words: string[]; // lowercase keywords, English and Arabic
  spec: DesignSpec;
  /** Finished height in cm for small / medium / large. */
  heights: [number, number, number];
}

const part = (p: Omit<PartSpec, "quantity" | "attachTo" | "position"> & Partial<Pick<PartSpec, "quantity" | "attachTo" | "position">>): PartSpec => ({
  quantity: 1,
  attachTo: null,
  position: { x: 0, y: 0, z: 0 },
  ...p,
});

const spec = (category: DesignSpec["category"], overall: number, parts: PartSpec[], notes = ""): DesignSpec => ({
  category,
  confidence: 0.9,
  overallHeightRatio: overall,
  parts,
  notes,
});

export const TEMPLATES: Template[] = [
  { key: "bear", type: "toy", name: { en: "Bear", ar: "دب" }, words: ["bear", "teddy", "دب", "دبدوب", "دبدوبة"], spec: BEAR_WITH_EARS, heights: [10, 15, 25] },
  {
    key: "bunny",
    type: "toy",
    name: { en: "Bunny", ar: "أرنب" },
    words: ["bunny", "rabbit", "hare", "ارنب", "أرنب", "ارنوب", "أرنوب"],
    spec: spec("amigurumi", 2.3, [
      part({ id: "body", name: "Body", shape: "ellipsoid", dims: { width: 0.85, height: 1, depth: 0.8 }, colorHex: "#F3E6D4" }),
      part({ id: "head", name: "Head", shape: "sphere", dims: { width: 0.85, height: 0.85, depth: 0.85 }, colorHex: "#F3E6D4", attachTo: "body", position: { x: 0, y: 1, z: 0 } }),
      part({ id: "ear", name: "Ear", shape: "capsule", dims: { width: 0.24, height: 0.75, depth: 0.12 }, colorHex: "#F3B6B6", quantity: 2, attachTo: "head", position: { x: 0.35, y: 0.9, z: 0 } }),
      part({ id: "arm", name: "Arm", shape: "capsule", dims: { width: 0.2, height: 0.5, depth: 0.2 }, colorHex: "#F3E6D4", quantity: 2, attachTo: "body", position: { x: 0.9, y: 0.4, z: 0 } }),
    ]),
    heights: [12, 18, 28],
  },
  {
    key: "cat",
    type: "toy",
    name: { en: "Cat", ar: "قطة" },
    words: ["cat", "kitty", "kitten", "قطة", "قطه", "قط", "بسة", "بسه", "بس"],
    spec: spec("amigurumi", 2, [
      part({ id: "body", name: "Body", shape: "ellipsoid", dims: { width: 0.85, height: 1, depth: 0.8 }, colorHex: "#3A3535" }),
      part({ id: "head", name: "Head", shape: "sphere", dims: { width: 0.95, height: 0.9, depth: 0.9 }, colorHex: "#3A3535", attachTo: "body", position: { x: 0, y: 1, z: 0 } }),
      part({ id: "ear", name: "Ear", shape: "cone", dims: { width: 0.26, height: 0.24, depth: 0.26 }, colorHex: "#3A3535", quantity: 2, attachTo: "head", position: { x: 0.55, y: 0.75, z: 0 } }),
      part({ id: "tail", name: "Tail", shape: "capsule", dims: { width: 0.16, height: 0.8, depth: 0.16 }, colorHex: "#3A3535", attachTo: "body", position: { x: 0, y: -0.6, z: -0.9 } }),
    ]),
    heights: [10, 15, 24],
  },
  {
    key: "penguin",
    type: "toy",
    name: { en: "Penguin", ar: "بطريق" },
    words: ["penguin", "بطريق"],
    spec: spec("amigurumi", 1.3, [
      part({ id: "body", name: "Body", shape: "ellipsoid", dims: { width: 0.85, height: 1.3, depth: 0.8 }, colorHex: "#2B2D42" }),
      part({ id: "wing", name: "Wing", shape: "ear", dims: { width: 0.25, height: 0.5, depth: 0.08 }, colorHex: "#2B2D42", quantity: 2, attachTo: "body", position: { x: 0.95, y: 0.2, z: 0 } }),
      part({ id: "beak", name: "Beak", shape: "cone", dims: { width: 0.18, height: 0.14, depth: 0.18 }, colorHex: "#F2A541", attachTo: "body", position: { x: 0, y: 0.45, z: 0.95 } }),
    ]),
    heights: [8, 12, 20],
  },
  { key: "ball", type: "toy", name: { en: "Ball", ar: "كرة" }, words: ["ball", "kora", "كرة", "كوره", "كورة", "head", "راس"], spec: BALL_HEAD, heights: [6, 8, 12] },

  {
    key: "tote",
    type: "bag",
    name: { en: "Tote bag", ar: "شنطة توت" },
    words: ["tote", "shopping", "market", "توت", "تسوق", "سوق", "قماش"],
    spec: spec("flat", 1.2, [
      part({ id: "panel", name: "Front and back", shape: "rectangle", dims: { width: 0.85, height: 1, depth: 0.05 }, colorHex: "#D9C3A5", quantity: 2 }),
      part({ id: "strap", name: "Strap", shape: "rectangle", dims: { width: 0.07, height: 1.2, depth: 0.05 }, colorHex: "#7A4E36", quantity: 2 }),
    ]),
    heights: [28, 36, 44],
  },
  {
    key: "granny-bag",
    type: "bag",
    name: { en: "Granny-square bag", ar: "شنطة مربعات جراني" },
    words: ["granny", "square", "patchwork", "جراني", "مربع", "مربعات", "باتشورك"],
    spec: spec("flat", 1, [
      part({ id: "square", name: "Square", shape: "granny_square", dims: { width: 0.45, height: 0.45, depth: 0.05 }, colorHex: "#E29B6A", quantity: 6 }),
      part({ id: "strap", name: "Strap", shape: "rectangle", dims: { width: 0.07, height: 1, depth: 0.05 }, colorHex: "#8E1523" }),
    ]),
    heights: [30, 38, 46],
  },
  {
    key: "pouch",
    type: "bag",
    name: { en: "Small pouch", ar: "محفظة صغيرة" },
    words: ["pouch", "purse", "wallet", "coin", "makeup", "محفظة", "بوك", "مكياج", "شنطة صغيرة"],
    spec: spec("flat", 1, [part({ id: "panel", name: "Front and back", shape: "rectangle", dims: { width: 1.4, height: 1, depth: 0.05 }, colorHex: "#F3B6B6", quantity: 2 })]),
    heights: [10, 14, 18],
  },

  {
    key: "top",
    type: "clothes",
    name: { en: "Summer top", ar: "بلوزة صيفية" },
    words: ["top", "crop", "tank", "blouse", "shirt", "بلوزة", "بلوزه", "توب", "كروب", "قميص", "تيشيرت"],
    spec: spec("flat", 1, [
      part({ id: "front", name: "Front", shape: "rectangle", dims: { width: 0.85, height: 1, depth: 0.05 }, colorHex: "#2F8F8A" }),
      part({ id: "back", name: "Back", shape: "rectangle", dims: { width: 0.85, height: 1, depth: 0.05 }, colorHex: "#2F8F8A" }),
      part({ id: "strap", name: "Shoulder strap", shape: "rectangle", dims: { width: 0.06, height: 0.5, depth: 0.05 }, colorHex: "#2F8F8A", quantity: 2 }),
    ]),
    heights: [40, 45, 50],
  },
  {
    key: "cardigan",
    type: "clothes",
    name: { en: "Cardigan", ar: "كارديجان" },
    words: ["cardigan", "jacket", "sweater", "jumper", "كارديجان", "كارديغان", "جاكيت", "سويتر", "بلوفر", "سترة"],
    spec: spec("flat", 1, [
      part({ id: "back", name: "Back", shape: "rectangle", dims: { width: 0.9, height: 1, depth: 0.05 }, colorHex: "#7A4E36" }),
      part({ id: "front", name: "Front panel", shape: "rectangle", dims: { width: 0.45, height: 1, depth: 0.05 }, colorHex: "#7A4E36", quantity: 2 }),
      part({ id: "sleeve", name: "Sleeve", shape: "rectangle", dims: { width: 0.7, height: 0.95, depth: 0.05 }, colorHex: "#7A4E36", quantity: 2 }),
    ]),
    heights: [55, 60, 66],
  },
  {
    key: "vest",
    type: "clothes",
    name: { en: "Granny vest", ar: "صديري جراني" },
    words: ["vest", "waistcoat", "gilet", "صديري", "صدرية", "فيست"],
    spec: spec("flat", 1, [part({ id: "square", name: "Square", shape: "granny_square", dims: { width: 0.33, height: 0.33, depth: 0.05 }, colorHex: "#E29B6A", quantity: 12 })]),
    heights: [42, 48, 54],
  },
  {
    key: "scarf",
    type: "clothes",
    name: { en: "Scarf", ar: "سكارف" },
    words: ["scarf", "shawl", "سكارف", "وشاح", "شال", "لفحة"],
    spec: spec("flat", 1, [part({ id: "scarf", name: "Scarf", shape: "rectangle", dims: { width: 0.12, height: 1, depth: 0.05 }, colorHex: "#8E1523" })]),
    heights: [140, 160, 180],
  },

  {
    key: "blanket",
    type: "flat",
    name: { en: "Granny blanket", ar: "بطانية جراني" },
    words: ["blanket", "throw", "afghan", "بطانية", "بطانيه", "لحاف", "غطاء"],
    spec: spec("flat", 1, [part({ id: "square", name: "Square", shape: "granny_square", dims: { width: 0.2, height: 0.2, depth: 0.05 }, colorHex: "#F0A13A", quantity: 20 })]),
    heights: [80, 110, 140],
  },
  {
    key: "coaster",
    type: "flat",
    name: { en: "Coaster", ar: "كوستر" },
    words: ["coaster", "mat", "doily", "كوستر", "قاعدة", "مفرش"],
    spec: spec("flat", 1, [part({ id: "square", name: "Coaster", shape: "granny_square", dims: { width: 1, height: 1, depth: 0.05 }, colorHex: "#F3B6B6", quantity: 4 })]),
    heights: [9, 11, 14],
  },
  {
    key: "rectangle-blanket",
    type: "flat",
    name: { en: "Plain blanket", ar: "بطانية سادة" },
    words: ["baby", "plain", "simple", "بيبي", "طفل", "سادة", "بسيطة"],
    spec: spec("flat", 1, [part({ id: "blanket", name: "Blanket", shape: "rectangle", dims: { width: 0.8, height: 1, depth: 0.05 }, colorHex: "#A9CFE0" })]),
    heights: [70, 90, 110],
  },
];

const TAPESTRY_WORDS: Record<TapestryId, string[]> = {
  "dunes-at-noon": ["dune", "desert", "sand", "sun", "كثبان", "صحراء", "رمل", "شمس"],
  "al-sadu": ["sadu", "bedouin", "pattern", "سدو", "السدو", "بدو", "نقشة"],
  "palm-and-moon": ["palm", "tree", "نخلة", "نخل", "شجرة"],
  "arched-window": ["arch", "window", "door", "mosque", "قوس", "نافذة", "شباك", "باب", "مسجد"],
  "mountain-dawn": ["mountain", "hill", "dawn", "جبل", "جبال", "فجر"],
  tulip: ["tulip", "flower", "rose", "توليب", "ورد", "وردة", "زهرة"],
  "sea-waves": ["sea", "wave", "ocean", "beach", "بحر", "موج", "شاطئ"],
  "crescent-night": ["moon", "crescent", "night", "star", "ramadan", "قمر", "هلال", "ليل", "نجم", "رمضان"],
  "blush-check": ["heart", "check", "love", "قلب", "مربعات", "حب"],
};

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[إأآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[ً-ْ]/g, ""); // Arabic diacritics
}

function score(words: string[], text: string): number {
  const t = normalize(text);
  return words.reduce((s, w) => (t.includes(normalize(w)) ? s + Math.max(1, w.length / 3) : s), 0);
}

/** Best template for a type and a description. "other" searches every template. */
export function matchTemplate(type: Exclude<MakeType, "wall">, text: string): Template {
  const pool = type === "other" ? TEMPLATES : TEMPLATES.filter((t) => t.type === type);
  let best = pool[0];
  let bestScore = -1;
  for (const tpl of pool) {
    const s = score(tpl.words, text);
    if (s > bestScore) {
      best = tpl;
      bestScore = s;
    }
  }
  if (type === "other" && bestScore <= 0) return TEMPLATES.find((t) => t.key === "ball")!;
  return best;
}

export function matchTapestry(text: string): TapestryId {
  let best: TapestryId = "dunes-at-noon";
  let bestScore = 0;
  (Object.keys(TAPESTRIES) as TapestryId[]).forEach((id) => {
    const s = score(TAPESTRY_WORDS[id], text);
    if (s > bestScore) {
      best = id;
      bestScore = s;
    }
  });
  return best;
}

/** Color words, so "a brown bear" comes out brown. */
const COLOR_WORDS: [string[], string][] = [
  [["brown", "بني", "بنيه", "كاكاو", "شوكولا"], "#7A4E36"],
  [["beige", "cream", "بيج", "كريمي", "سكري"], "#E8D5C0"],
  [["white", "ابيض", "بيضاء", "بيضا"], "#F6F3EE"],
  [["black", "اسود", "سوداء", "سودا"], "#2A2627"],
  [["grey", "gray", "رمادي", "رماديه"], "#9A9496"],
  [["pink", "وردي", "ورديه", "زهري"], "#F3B6B6"],
  [["red", "احمر", "حمراء", "حمرا"], "#C8323A"],
  [["orange", "برتقالي"], "#E8833A"],
  [["yellow", "اصفر", "صفراء", "صفرا"], "#F2C230"],
  [["green", "اخضر", "خضراء", "خضرا"], "#6F8F4A"],
  [["blue", "ازرق", "زرقاء", "زرقا", "كحلي"], "#4F7CAC"],
  [["purple", "lilac", "بنفسجي", "ليلكي", "موف"], "#8E6BB5"],
];

export function colorFromText(text: string): string | null {
  const t = normalize(text);
  for (const [words, hex] of COLOR_WORDS) if (words.some((w) => t.includes(normalize(w)))) return hex;
  return null;
}

/**
 * Recolors a template: the first color goes to the main parts (those with the template's
 * first color), the second to the rest. Keeps everything else.
 */
export function recolor(s: DesignSpec, colors: string[]): DesignSpec {
  if (colors.length === 0) return s;
  const main = s.parts[0].colorHex.toUpperCase();
  return {
    ...s,
    parts: s.parts.map((p) => ({ ...p, colorHex: p.colorHex.toUpperCase() === main ? colors[0] : (colors[1] ?? colors[0]) })),
  };
}

export function heightFor(tpl: Template, size: SizeChoice): number {
  return tpl.heights[size === "small" ? 0 : size === "medium" ? 1 : 2];
}
