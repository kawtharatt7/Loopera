"use client";

import { useEffect, useState } from "react";

/*
  Repaints a piece in another yarn color, in the browser. Works in CIELAB: pixels whose color is
  close to the piece's own color (and inside its mask, so skin, hair and the background stay)
  are shifted to the target hue and chroma; lightness moves by the same amount for every pixel,
  so the stitch shading and texture are kept.
*/

type Lab = [number, number, number];

const toLin = (c: number) => (c > 0.04045 ? ((c + 0.055) / 1.055) ** 2.4 : c / 12.92);
const toSrgb = (c: number) => (c > 0.0031308 ? 1.055 * Math.max(c, 0) ** (1 / 2.4) - 0.055 : 12.92 * c);
const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
const fi = (t: number) => (t ** 3 > 0.008856 ? t ** 3 : (t - 16 / 116) / 7.787);

export function rgbToLab(r: number, g: number, b: number): Lab {
  const R = toLin(r / 255);
  const G = toLin(g / 255);
  const B = toLin(b / 255);
  const x = f((0.4124 * R + 0.3576 * G + 0.1805 * B) / 0.95047);
  const y = f(0.2126 * R + 0.7152 * G + 0.0722 * B);
  const z = f((0.0193 * R + 0.1192 * G + 0.9505 * B) / 1.08883);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}

export function labToRgb(L: number, a: number, b: number): [number, number, number] {
  const fy = (L + 16) / 116;
  const X = fi(fy + a / 500) * 0.95047;
  const Y = fi(fy);
  const Z = fi(fy - b / 200) * 1.08883;
  const r = toSrgb(3.2406 * X - 1.5372 * Y - 0.4986 * Z);
  const g = toSrgb(-0.9689 * X + 1.8758 * Y + 0.0415 * Z);
  const bl = toSrgb(0.0557 * X - 0.204 * Y + 1.057 * Z);
  const c = (v: number) => Math.round(Math.min(255, Math.max(0, v * 255)));
  return [c(r), c(g), c(bl)];
}

const hexLab = (hex: string): Lab => {
  const n = parseInt(hex.slice(1), 16);
  return rgbToLab((n >> 16) & 255, (n >> 8) & 255, n & 255);
};

/** Recolors RGBA pixel data in place. `mask` is 0–255 per pixel (piece = 255) or null. Pure, tested. */
export function recolorPixels(data: Uint8ClampedArray, mask: Uint8ClampedArray | null, from: string, to: string): void {
  const s = hexLab(from);
  const t = hexLab(to);
  const chroma = Math.hypot(s[1], s[2]);
  const [t0, t1] = chroma >= 15 ? [16, 30] : [7, 15];
  const dL = (t[0] - s[0]) * 0.9;
  const da = t[1] - s[1];
  const db = t[2] - s[2];
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const m = mask ? mask[p] / 255 : 1;
    if (m <= 0.01) continue;
    const [L, a, b] = rgbToLab(data[i], data[i + 1], data[i + 2]);
    const dab = Math.hypot(a - s[1], b - s[2]);
    const w = m * Math.min(1, Math.max(0, 1 - (dab - t0) / (t1 - t0))) * Math.min(1, Math.max(0, 1 - (Math.abs(L - s[0]) - 55) / 30));
    if (w <= 0.01) continue;
    const [r, g, bl] = labToRgb(Math.min(100, Math.max(0, L + dL)), a + da, b + db);
    data[i] = data[i] + (r - data[i]) * w;
    data[i + 1] = data[i + 1] + (g - data[i + 1]) * w;
    data[i + 2] = data[i + 2] + (bl - data[i + 2]) * w;
  }
}

function load(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

const cache = new Map<string, Promise<string>>();

/** A data URL of the photo in the new color (cached). Same-origin photos only. */
export function recolorUrl(src: string, mask: string | undefined, from: string, to: string): Promise<string> {
  const key = `${src}|${to}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const job = (async () => {
    const [img, m] = await Promise.all([load(src), mask ? load(mask).catch(() => null) : Promise.resolve(null)]);
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d", { willReadFrequently: true })!;
    let maskData: Uint8ClampedArray | null = null;
    if (m) {
      ctx.drawImage(m, 0, 0, w, h);
      const md = ctx.getImageData(0, 0, w, h).data;
      maskData = new Uint8ClampedArray(w * h);
      for (let i = 0, p = 0; i < md.length; i += 4, p++) maskData[p] = md[i];
    }
    ctx.drawImage(img, 0, 0);
    const d = ctx.getImageData(0, 0, w, h);
    recolorPixels(d.data, maskData, from, to);
    ctx.putImageData(d, 0, 0);
    return c.toDataURL("image/webp", 0.9);
  })();
  cache.set(key, job);
  job.catch(() => cache.delete(key));
  return job;
}

/** The photo URL to show for a color: the original for "as-shown", otherwise the repainted one. */
export function useRecolored(src: string, recipe: { from: string; mask?: string } | undefined, colorHex: string | null): string {
  const [url, setUrl] = useState(src);
  useEffect(() => {
    let live = true;
    if (!recipe || !colorHex || colorHex === "transparent") {
      setUrl(src);
      return;
    }
    recolorUrl(src, recipe.mask, recipe.from, colorHex)
      .then((u) => live && setUrl(u))
      .catch(() => live && setUrl(src));
    return () => {
      live = false;
    };
  }, [src, recipe, colorHex]);
  return url;
}
