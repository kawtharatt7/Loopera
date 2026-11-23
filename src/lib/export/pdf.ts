import type { jsPDF as JsPDF } from "jspdf";
import type { Estimates } from "@/lib/engine/estimates";
import { ABBREVIATIONS, toTerms, type Terms } from "@/lib/engine/terms";
import type { Pattern } from "@/lib/engine/types";
import { tokenRgb } from "@/lib/theme-colors";

export interface PdfInput {
  title: string;
  pattern: Pattern;
  estimates: Estimates;
  terms: Terms;
  targetHeightCm: number;
  gaugeLabel: string;
  hookMm: number;
  /** PNG data URL of the preview, placed on the cover. */
  coverImage: string | null;
  siteName: string;
}

const PAGE = { w: 210, h: 297, m: 18 };

// PDFs are printed on paper, so they always use the light-mode text and paper colors.
export const PRINT_PAPER = "#FFF6F1";

/** Builds the pattern PDF (A4). jsPDF is loaded on demand so it never weighs down the first page. */
export async function buildPatternPdf(input: PdfInput): Promise<JsPDF> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const wine = tokenRgb("wine");
  const ember = tokenRgb("ember");
  const ink: [number, number, number] = [43, 15, 20]; // light-mode --fg
  const soft: [number, number, number] = [107, 52, 58]; // light-mode --muted-fg
  let y = PAGE.m;

  const ensure = (needed: number) => {
    if (y + needed > PAGE.h - PAGE.m) {
      doc.addPage();
      y = PAGE.m;
    }
  };
  const heading = (text: string, size = 16) => {
    ensure(size * 0.6 + 6);
    doc.setFont("times", "bold");
    doc.setFontSize(size);
    doc.setTextColor(...wine);
    doc.text(text, PAGE.m, y);
    y += size * 0.45 + 3;
  };
  const para = (text: string, size = 10, color = ink) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, PAGE.w - PAGE.m * 2) as string[];
    for (const line of lines) {
      ensure(size * 0.45 + 1);
      doc.text(line, PAGE.m, y);
      y += size * 0.45 + 1;
    }
  };

  // Cover
  doc.setFont("times", "bold");
  doc.setFontSize(28);
  doc.setTextColor(...wine);
  doc.text(input.title, PAGE.m, y + 8);
  y += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...soft);
  doc.text(`Crochet pattern · ${input.targetHeightCm} cm tall · ${input.terms.toUpperCase()} terms · made with ${input.siteName}`, PAGE.m, y);
  y += 8;

  if (input.coverImage) {
    const size = 110;
    doc.addImage(input.coverImage, input.coverImage.startsWith("data:image/jpeg") ? "JPEG" : "PNG", (PAGE.w - size) / 2, y, size, size);
    y += size + 8;
  }

  heading("Materials", 14);
  para(`Hook: ${input.hookMm} mm. Gauge: ${input.gaugeLabel}.`);
  for (const c of input.estimates.yarnByColor) {
    ensure(7);
    const [r, g, b] = [parseInt(c.colorHex.slice(1, 3), 16), parseInt(c.colorHex.slice(3, 5), 16), parseInt(c.colorHex.slice(5, 7), 16)];
    doc.setFillColor(r, g, b);
    doc.circle(PAGE.m + 2, y - 1.2, 2, "F");
    doc.setTextColor(...ink);
    doc.text(`${c.colorHex}  about ${c.meters} m`, PAGE.m + 7, y);
    y += 6;
  }
  para(`Stuffing, a yarn needle and a stitch marker. Working time about ${Math.max(1, Math.round(input.estimates.minutes / 60))} h. All amounts are approximate.`, 10, soft);
  y += 3;

  heading("Abbreviations", 14);
  for (const a of ABBREVIATIONS[input.terms]) {
    ensure(5.5);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...ink);
    doc.text(a.abbr, PAGE.m, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...soft);
    doc.text(a.meaning, PAGE.m + 24, y);
    y += 5;
  }

  // Parts
  for (const part of input.pattern.parts) {
    doc.addPage();
    y = PAGE.m;
    heading(`${part.name}${part.quantity > 1 ? ` (make ${part.quantity})` : ""}`, 18);
    para(`Color ${part.colorHex}. ${part.rounds.length} ${part.kind === "rectangle" ? "rows" : "rounds"}.`, 9.5, soft);
    y += 2;
    for (const r of part.rounds) {
      ensure(6);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...ember);
      doc.text(`${part.kind === "rectangle" ? "Row" : "R"}${r.number}`, PAGE.m, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...ink);
      const text = `${toTerms(r.instruction, input.terms)} (${r.stitches})`;
      const lines = doc.splitTextToSize(text, PAGE.w - PAGE.m * 2 - 16) as string[];
      lines.forEach((line, i) => {
        if (i > 0) ensure(5);
        doc.text(line, PAGE.m + 16, y);
        if (i < lines.length - 1) y += 4.8;
      });
      y += 5.6;
    }
    y += 2;
    para(part.finish, 10, soft);
  }

  if (input.pattern.assembly.length > 0) {
    doc.addPage();
    y = PAGE.m;
    heading("Assembly", 18);
    input.pattern.assembly.forEach((s, i) => para(`${i + 1}. ${s.text}`));
  }

  // Footer on every page
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...soft);
    doc.text(`${input.title} · ${input.siteName}`, PAGE.m, PAGE.h - 8);
    doc.text(`${p} / ${pages}`, PAGE.w - PAGE.m, PAGE.h - 8, { align: "right" });
  }
  return doc;
}

export function safeFileName(title: string): string {
  return (title.trim() || "pattern").replace(/[^a-z0-9-_ ]/gi, "").replace(/\s+/g, "-").toLowerCase().slice(0, 60) || "pattern";
}
