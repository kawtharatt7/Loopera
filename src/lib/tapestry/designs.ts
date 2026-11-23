// Tapestry crochet designs: each is a grid of color indices, one cell per single crochet.
// Row 0 is the top of the picture. These charts are original designs made for Loopera.

export interface TapestryDesign {
  id: string;
  width: number;
  height: number;
  palette: { name: { en: string; ar: string }; hex: string }[];
  /** grid[y][x] = palette index */
  grid: number[][];
}

type Painter = (x: number, y: number, w: number, h: number) => number;

function build(id: string, width: number, height: number, palette: TapestryDesign["palette"], paint: Painter): TapestryDesign {
  const grid: number[][] = [];
  for (let y = 0; y < height; y++) {
    const row: number[] = [];
    for (let x = 0; x < width; x++) row.push(paint(x, y, width, height));
    grid.push(row);
  }
  return { id, width, height, palette, grid };
}

const P = {
  cream: { name: { en: "Cream", ar: "كريمي" }, hex: "#F3E6D4" },
  sand: { name: { en: "Sand", ar: "رملي" }, hex: "#E1C08F" },
  peach: { name: { en: "Peach", ar: "خوخي" }, hex: "#E29B6A" },
  ember: { name: { en: "Ember", ar: "جمري" }, hex: "#CE4F2F" },
  wine: { name: { en: "Wine", ar: "نبيذي" }, hex: "#8E1523" },
  rose: { name: { en: "Rose", ar: "وردي" }, hex: "#F3B6B6" },
  night: { name: { en: "Night", ar: "ليلي" }, hex: "#2B1A33" },
  ink: { name: { en: "Ink", ar: "حبري" }, hex: "#1F1A1C" },
  gold: { name: { en: "Gold", ar: "ذهبي" }, hex: "#E8B64A" },
  olive: { name: { en: "Olive", ar: "زيتي" }, hex: "#6F7D3C" },
  sea: { name: { en: "Sea", ar: "بحري" }, hex: "#2F6F8F" },
  sky: { name: { en: "Sky", ar: "سماوي" }, hex: "#A9CFE0" },
  stone: { name: { en: "Stone", ar: "حجري" }, hex: "#8C7F7A" },
};

const dist = (x: number, y: number, cx: number, cy: number) => Math.hypot(x - cx, y - cy);

export const TAPESTRIES = {
  "dunes-at-noon": build("dunes-at-noon", 30, 40, [P.cream, P.peach, P.ember, P.wine, P.gold], (x, y) => {
    if (dist(x, y, 20, 11) < 5.2) return 4;
    const d1 = 24 + Math.sin(x / 4.2) * 2.5;
    const d2 = 29 + Math.sin(x / 5 + 2) * 2.5;
    const d3 = 34 + Math.sin(x / 3.6 + 4) * 1.8;
    if (y > d3) return 3;
    if (y > d2) return 2;
    if (y > d1) return 1;
    return 0;
  }),
  "al-sadu": build("al-sadu", 30, 42, [P.cream, P.wine, P.ink, P.gold], (x, y) => {
    // Al Sadu style: horizontal bands of triangles and diamonds.
    const band = Math.floor(y / 7);
    const yy = y % 7;
    if (yy === 0 || yy === 6) return 2;
    if (band % 2 === 0) {
      const t = Math.abs(((x + 3) % 6) - 3);
      return yy >= 1 + t && yy <= 5 - t + 1 && yy <= 5 ? 1 : 0;
    }
    const t = Math.abs(((x + band) % 8) - 4);
    if (t + Math.abs(yy - 3) <= 2) return 3;
    return 1;
  }),
  "palm-and-moon": build("palm-and-moon", 30, 40, [P.night, P.cream, P.olive, P.sand, P.gold], (x, y) => {
    if (dist(x, y, 21, 8) < 4.5 && dist(x, y, 23, 7) >= 4) return 4;
    if (y > 34) return 3;
    // trunk, leaning slightly
    const tx = 11 + (34 - y) * 0.08;
    if (y > 15 && y <= 34 && Math.abs(x - tx) < 1.2) return 3;
    // fronds radiating from the top of the trunk
    const fx = 12.4;
    const fy = 15;
    for (const a of [-2.6, -2, -1.2, -0.4, 0.4]) {
      for (let r = 1; r < 9; r++) {
        const px = fx + Math.cos(a) * r;
        const py = fy + Math.sin(a) * r * 0.8 + r * r * 0.06;
        if (dist(x, y, px, py) < 0.85) return 2;
      }
    }
    return 0;
  }),
  "arched-window": build("arched-window", 30, 42, [P.sand, P.wine, P.sky, P.cream, P.gold], (x, y) => {
    const cx = 14.5;
    const half = 9;
    const top = 8;
    const inArch = y >= top + half ? Math.abs(x - cx) < half && y < 37 : dist(x, y, cx, top + half) < half;
    const inInner = y >= top + half ? Math.abs(x - cx) < half - 2 && y < 35 : dist(x, y, cx, top + half) < half - 2;
    if (inInner) {
      if (dist(x, y, 18, 15) < 1.2 || dist(x, y, 11, 19) < 1) return 4;
      if (Math.abs(x - cx) < 0.6 && y > top + 3) return 3;
      return 2;
    }
    if (inArch) return 1;
    if (y >= 37) return 1;
    return 0;
  }),
  "mountain-dawn": build("mountain-dawn", 30, 40, [P.rose, P.peach, P.stone, P.cream, P.wine, P.olive], (x, y) => {
    const peak = (cx: number, top: number, slope: number) => y >= top + Math.abs(x - cx) * slope;
    if (y > 34) return 5;
    if (peak(9, 12, 1.1)) return y < 15 ? 3 : 4;
    if (peak(21, 9, 1.2)) return y < 12.5 ? 3 : 2;
    if (dist(x, y, 15, 10) < 3) return 1;
    return y < 7 ? 0 : 1;
  }),
  tulip: build("tulip", 30, 40, [P.cream, P.ember, P.wine, P.olive], (x, y) => {
    const cx = 14.5;
    if (y > 18 && y < 36 && Math.abs(x - cx) < 0.8) return 3;
    if (y > 24 && y < 31 && Math.abs(x - (cx - 3 - (y - 24) * 0.4)) < 1.4 && x < cx) return 3;
    if (y > 22 && y < 29 && Math.abs(x - (cx + 3 + (y - 22) * 0.4)) < 1.4 && x > cx) return 3;
    const cup = y > 8 && y < 19 && Math.abs(x - cx) < 6 - Math.max(0, y - 14) * 0.9;
    if (cup) {
      if (y < 12 && (Math.abs(x - cx) < 1 || Math.abs(x - cx) > 3.8)) return y < 10 ? 0 : 1;
      return Math.abs(x - cx) < 2 ? 2 : 1;
    }
    return 0;
  }),
  "sea-waves": build("sea-waves", 30, 40, [P.cream, P.sky, P.sea, P.night], (x, y) => {
    const w = (o: number, a: number, f: number) => y > o + Math.sin(x / f + o) * a;
    if (w(32, 1.6, 2.4)) return 3;
    if (w(24, 2, 2.9)) return 2;
    if (w(15, 2.2, 3.2)) return 1;
    return 0;
  }),
  "crescent-night": build("crescent-night", 30, 40, [P.night, P.gold, P.cream, P.wine], (x, y) => {
    if (dist(x, y, 15, 16) < 7 && dist(x, y, 18, 14) >= 6) return 1;
    for (const [sx, sy] of [
      [5, 6],
      [24, 5],
      [26, 24],
      [6, 28],
      [12, 33],
      [22, 34],
    ]) {
      if ((x === sx && Math.abs(y - sy) <= 1) || (y === sy && Math.abs(x - sx) <= 1)) return 2;
    }
    if (y > 37) return 3;
    return 0;
  }),
  "blush-check": build("blush-check", 30, 40, [P.cream, P.rose, P.wine], (x, y) => {
    const hx = (x - 14.5) / 6;
    const hy = (y - 19) / 6;
    if ((hx * hx + hy * hy - 1) ** 3 - hx * hx * hy * hy * hy < 0) return 2;
    return (Math.floor(x / 5) + Math.floor(y / 5)) % 2 === 0 ? 0 : 1;
  }),
} as const;

export type TapestryId = keyof typeof TAPESTRIES;

export function isTapestryId(v: string): v is TapestryId {
  return v in TAPESTRIES;
}
