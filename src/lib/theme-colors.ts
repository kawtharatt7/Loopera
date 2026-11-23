// Reads palette tokens from the CSS variables in globals.css, so canvases (three.js, PDF, PNG)
// use exactly the same colors as the rest of the UI without any raw hex in components.

export type PaletteToken = "wine" | "ember" | "peach" | "rose" | "bg" | "surface" | "surface-2" | "fg" | "muted-fg";

const FALLBACK: Record<PaletteToken, string> = {
  wine: "142 21 35",
  ember: "206 79 47",
  peach: "226 155 106",
  rose: "243 182 182",
  bg: "26 11 14",
  surface: "42 18 23",
  "surface-2": "56 25 31",
  fg: "251 237 232",
  "muted-fg": "216 185 180",
};

function channels(token: PaletteToken): number[] {
  let raw = FALLBACK[token];
  if (typeof document !== "undefined") {
    const v = getComputedStyle(document.documentElement).getPropertyValue(`--${token}`).trim();
    if (v) raw = v;
  }
  return raw.split(/\s+/).map((n) => Number(n));
}

/** "#RRGGBB" for a palette token. */
export function tokenHex(token: PaletteToken): string {
  return `#${channels(token)
    .map((n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0"))
    .join("")}`.toUpperCase();
}

/** [r, g, b] 0-255 for a palette token. */
export function tokenRgb(token: PaletteToken): [number, number, number] {
  const [r, g, b] = channels(token);
  return [r, g, b];
}

export const BRAND_TOKENS: PaletteToken[] = ["wine", "ember", "peach", "rose"];
