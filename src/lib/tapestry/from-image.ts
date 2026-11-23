// Browser-only helpers: read an uploaded photo into pixels for the chart and the yarn colors.
import { chartFromPixels, kmeans, toHex, type RGB } from "./quantize";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function acceptable(file: File): boolean {
  return ACCEPTED_TYPES.includes(file.type) && file.size <= MAX_UPLOAD_BYTES;
}

/** Decodes the file. Drawing to a canvas also drops EXIF and any other metadata. */
export async function decode(file: File): Promise<ImageBitmap> {
  return createImageBitmap(file, { imageOrientation: "from-image" });
}

function sample(img: ImageBitmap, w: number, h: number): RGB[] {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas is not available");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;
  const out: RGB[] = [];
  for (let i = 0; i < data.length; i += 4) {
    // Transparent pixels count as white paper.
    const a = data[i + 3] / 255;
    out.push([Math.round(data[i] * a + 255 * (1 - a)), Math.round(data[i + 1] * a + 255 * (1 - a)), Math.round(data[i + 2] * a + 255 * (1 - a))]);
  }
  return out;
}

/** Stitch chart from a photo: `width` stitches across, height from the photo's shape (sc is ~1.1× taller than wide). */
export function chartFromImage(img: ImageBitmap, width: number, colors: number): { grid: number[][]; palette: string[] } {
  const height = Math.max(4, Math.round(((width * img.height) / img.width) / 1.1));
  const { grid, palette } = chartFromPixels(sample(img, width, height), width, height, colors);
  return { grid, palette: palette.map(toHex) };
}

/** The main colors of a photo, most common first, for yarn suggestions. */
export function dominantColors(img: ImageBitmap, k = 3): string[] {
  const px = sample(img, 40, 40);
  // Ignore near-white and near-black backgrounds when choosing yarn colors.
  const body = px.filter(([r, g, b]) => {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    return max > 35 && !(min > 225);
  });
  const centers = kmeans(body.length > 50 ? body : px, k);
  const counts = centers.map(() => 0);
  for (const p of body.length > 50 ? body : px) {
    let best = 0;
    let bestD = Infinity;
    centers.forEach((c, i) => {
      const d = (c[0] - p[0]) ** 2 + (c[1] - p[1]) ** 2 + (c[2] - p[2]) ** 2;
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    counts[best]++;
  }
  return centers
    .map((c, i) => ({ c, n: counts[i] }))
    .sort((a, b) => b.n - a.n)
    .map((x) => toHex(x.c));
}
