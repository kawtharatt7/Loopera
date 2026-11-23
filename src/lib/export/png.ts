import { tokenHex } from "@/lib/theme-colors";

/** PNG data URL of the 3D canvas on a solid background (the canvas itself is transparent). */
export function canvasToPng(canvas: HTMLCanvasElement, background: string = tokenHex("bg"), type: "image/png" | "image/jpeg" = "image/png"): string {
  const out = document.createElement("canvas");
  out.width = canvas.width;
  out.height = canvas.height;
  const ctx = out.getContext("2d");
  if (!ctx) return canvas.toDataURL("image/png");
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.drawImage(canvas, 0, 0);
  return out.toDataURL(type, 0.88);
}

/** PNG data URL of an inline SVG (used by the 2D views), drawn at the given width. */
export async function svgToPng(svg: SVGSVGElement, width = 1200): Promise<string> {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  // Inline the computed fill and stroke so CSS classes survive serialization.
  const src = svg.querySelectorAll<SVGElement>("*");
  const dst = clone.querySelectorAll<SVGElement>("*");
  src.forEach((el, i) => {
    const cs = getComputedStyle(el);
    const target = dst[i];
    if (!target) return;
    target.setAttribute("fill", cs.fill);
    target.setAttribute("stroke", cs.stroke);
    target.setAttribute("opacity", cs.opacity);
  });
  const vb = svg.viewBox.baseVal;
  const ratio = vb && vb.width ? vb.height / vb.width : 1;
  clone.setAttribute("width", String(width));
  clone.setAttribute("height", String(Math.round(width * ratio)));
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  const blob = new Blob([new XMLSerializer().serializeToString(clone)], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Could not draw the preview"));
      img.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = Math.round(width * ratio);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is not available");
    ctx.fillStyle = tokenHex("bg");
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
