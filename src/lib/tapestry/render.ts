// Draws a tapestry chart as a finished crochet wall hanging on a canvas: each cell is a
// single-crochet stitch with light and shade, hung from a wooden dowel with a cotton fringe.
// Browser-only (uses canvas).

export interface RenderOptions {
  cell: number; // px per stitch
  fringe: boolean;
  dowel: boolean;
  background?: string; // transparent when omitted
}

function shade(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, Math.round(((n >> 16) & 255) * f)));
  const g = Math.max(0, Math.min(255, Math.round(((n >> 8) & 255) * f)));
  const b = Math.max(0, Math.min(255, Math.round((n & 255) * f)));
  return `rgb(${r},${g},${b})`;
}

/** Size in px of the full hanging for a given chart. */
export function hangingSize(width: number, height: number, o: RenderOptions): { w: number; h: number; top: number } {
  const top = o.dowel ? o.cell * 3 : 0;
  const fringe = o.fringe ? o.cell * 7 : 0;
  return { w: width * o.cell + (o.dowel ? o.cell * 4 : 0), h: top + height * o.cell * 1.1 + fringe, top };
}

export function drawHanging(canvas: HTMLCanvasElement, grid: number[][], palette: string[], o: RenderOptions): void {
  const height = grid.length;
  const width = grid[0]?.length ?? 0;
  const { w, h, top } = hangingSize(width, height, o);
  canvas.width = Math.ceil(w);
  canvas.height = Math.ceil(h);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  if (o.background) {
    ctx.fillStyle = o.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  const cw = o.cell;
  const ch = o.cell * 1.1; // single crochet is a little taller than wide
  const left = o.dowel ? cw * 2 : 0;

  // Hanging cord and dowel
  if (o.dowel) {
    ctx.strokeStyle = "rgba(60,40,30,0.6)";
    ctx.lineWidth = Math.max(1, cw * 0.18);
    ctx.beginPath();
    ctx.moveTo(left + cw, top * 0.55);
    ctx.lineTo(w / 2, 0);
    ctx.lineTo(w - left - cw, top * 0.55);
    ctx.stroke();
  }

  // Stitches
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const hex = palette[grid[y][x]] ?? "#cccccc";
      const px = left + x * cw;
      const py = top + y * ch;
      ctx.fillStyle = shade(hex, 0.78);
      ctx.fillRect(px, py, cw + 0.5, ch + 0.5);
      // the two legs of the "V" of a single crochet
      const g = ctx.createLinearGradient(px, py, px, py + ch);
      g.addColorStop(0, shade(hex, 1.12));
      g.addColorStop(1, shade(hex, 0.9));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(px + cw * 0.3, py + ch * 0.52, cw * 0.27, ch * 0.44, -0.35, 0, Math.PI * 2);
      ctx.ellipse(px + cw * 0.7, py + ch * 0.52, cw * 0.27, ch * 0.44, 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.fillRect(px + cw * 0.2, py + ch * 0.18, cw * 0.6, ch * 0.08);
    }
  }

  if (o.dowel) {
    const dg = ctx.createLinearGradient(0, top * 0.45, 0, top * 0.95);
    dg.addColorStop(0, "#D9AE78");
    dg.addColorStop(1, "#9C6B3E");
    ctx.fillStyle = dg;
    const r = cw * 0.55;
    ctx.beginPath();
    ctx.roundRect(0, top * 0.5, w, top * 0.45, r);
    ctx.fill();
  }

  // Fringe: one strand per two stitches, in the color of the bottom row
  if (o.fringe) {
    const base = top + height * ch;
    const len = cw * 6.5;
    for (let x = 0; x < width; x += 2) {
      const hex = palette[grid[height - 1][x]] ?? "#cccccc";
      ctx.strokeStyle = shade(hex, 0.95);
      ctx.lineWidth = Math.max(1, cw * 0.32);
      ctx.lineCap = "round";
      const sx = left + x * cw + cw;
      ctx.beginPath();
      ctx.moveTo(sx, base);
      ctx.quadraticCurveTo(sx + cw * 0.3, base + len * 0.5, sx - cw * 0.1, base + len * (0.85 + ((x * 7) % 5) * 0.03));
      ctx.stroke();
    }
  }
}

export function hangingDataUrl(grid: number[][], palette: string[], o: RenderOptions): string {
  const c = document.createElement("canvas");
  drawHanging(c, grid, palette, o);
  return c.toDataURL("image/png");
}
