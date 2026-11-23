// Turns pixels into a tapestry chart: k-means color reduction, then nearest-color mapping.
// Pure functions; the canvas sampling lives in from-image.ts.

export type RGB = [number, number, number];

function d2(a: RGB, b: RGB): number {
  // Weighted distance, closer to how eyes compare colors than plain RGB.
  const rm = (a[0] + b[0]) / 2;
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return (2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db;
}

export function nearest(c: RGB, palette: RGB[]): number {
  let best = 0;
  let bestD = Infinity;
  palette.forEach((p, i) => {
    const d = d2(c, p);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  });
  return best;
}

/** k-means with deterministic k-means++ style seeding (farthest point), fixed iterations. */
export function kmeans(pixels: RGB[], k: number, iterations = 12): RGB[] {
  if (pixels.length === 0) return [];
  const kk = Math.max(1, Math.min(k, pixels.length));
  const centers: RGB[] = [pixels[Math.floor(pixels.length / 2)]];
  while (centers.length < kk) {
    let far = pixels[0];
    let farD = -1;
    for (const p of pixels) {
      const d = Math.min(...centers.map((c) => d2(p, c)));
      if (d > farD) {
        farD = d;
        far = p;
      }
    }
    centers.push(far);
  }
  for (let it = 0; it < iterations; it++) {
    const sums = centers.map(() => [0, 0, 0, 0]);
    for (const p of pixels) {
      const i = nearest(p, centers);
      sums[i][0] += p[0];
      sums[i][1] += p[1];
      sums[i][2] += p[2];
      sums[i][3]++;
    }
    sums.forEach((s, i) => {
      if (s[3] > 0) centers[i] = [Math.round(s[0] / s[3]), Math.round(s[1] / s[3]), Math.round(s[2] / s[3])];
    });
  }
  return centers;
}

/** Removes lone single stitches (one-stitch color changes are hard to work and look noisy). */
export function smoothSingles(grid: number[][]): number[][] {
  return grid.map((row) =>
    row.map((c, x) => {
      const l = row[x - 1];
      const r = row[x + 1];
      return l !== undefined && r !== undefined && l === r && l !== c ? l : c;
    }),
  );
}

export function toHex(c: RGB): string {
  return `#${c.map((n) => n.toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

export function chartFromPixels(pixels: RGB[], width: number, height: number, colors: number): { grid: number[][]; palette: RGB[] } {
  const palette = kmeans(pixels, colors);
  const grid: number[][] = [];
  for (let y = 0; y < height; y++) {
    const row: number[] = [];
    for (let x = 0; x < width; x++) row.push(nearest(pixels[y * width + x], palette));
    grid.push(row);
  }
  return { grid: smoothSingles(grid), palette };
}
