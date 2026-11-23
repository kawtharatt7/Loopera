"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { rowText, tapestryPattern } from "@/lib/engine/tapestry";
import { presetFor } from "@/lib/engine/gauge";
import { ESTIMATE_CONSTANTS } from "@/lib/engine/estimates";
import type { Bi } from "@/lib/i18n/config";
import { useT } from "@/lib/i18n/client";
import { drawHanging } from "@/lib/tapestry/render";

interface Props {
  grid: number[][];
  palette: string[];
  names: Bi[];
  done: Set<string>;
  toggle: (key: string) => void;
}

/** A tapestry chart, the finished hanging, and every row written out with a tick box. */
export function TapestryResult({ grid, palette, names, done, toggle }: Props) {
  const { t, bi, locale } = useT();
  const ar = locale === "ar";
  const pattern = useMemo(() => tapestryPattern(grid, palette.length), [grid, palette.length]);
  const [current, setCurrent] = useState(0); // 0-based row index (row 1 = bottom)
  const chart = useRef<HTMLCanvasElement>(null);
  const hanging = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (hanging.current) drawHanging(hanging.current, grid, palette, { cell: 9, fringe: true, dowel: true });
  }, [grid, palette]);

  useEffect(() => {
    const c = chart.current;
    if (!c) return;
    const cell = 12;
    const w = pattern.width;
    const h = pattern.height;
    c.width = w * cell;
    c.height = h * cell;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        ctx.fillStyle = palette[grid[y][x]];
        ctx.fillRect(x * cell, y * cell, cell, cell);
      }
    }
    ctx.strokeStyle = "rgba(0,0,0,0.18)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= w; x++) {
      ctx.beginPath();
      ctx.moveTo(x * cell + 0.5, 0);
      ctx.lineTo(x * cell + 0.5, h * cell);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * cell + 0.5);
      ctx.lineTo(w * cell, y * cell + 0.5);
      ctx.stroke();
    }
    // Finished rows are shaded; the current row is outlined.
    for (let i = 0; i < h; i++) {
      if (done.has(`row:${i + 1}`)) {
        ctx.fillStyle = "rgba(255,255,255,0.45)";
        ctx.fillRect(0, (h - 1 - i) * cell, w * cell, cell);
      }
    }
    ctx.strokeStyle = "#E29B6A";
    ctx.lineWidth = 3;
    ctx.strokeRect(1.5, (h - 1 - current) * cell + 1.5, w * cell - 3, cell - 3);
  }, [grid, palette, pattern, current, done]);

  const gauge = presetFor("worsted").gauge;
  const meters = (n: number) => Math.max(1, Math.ceil((n * gauge.stitchWidthCm * ESTIMATE_CONSTANTS.yarnPerStitchWidths * 1.35) / 100));
  const name = (i: number) => bi(names[i] ?? { en: `Color ${i + 1}`, ar: `لون ${i + 1}` });
  const doneCount = pattern.rows.filter((r) => done.has(`row:${r.number}`)).length;

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
        <div className="flex items-start justify-center rounded-xl bg-surface/70 p-6">
          <canvas ref={hanging} className="h-auto max-h-[52vh] w-auto max-w-full drop-shadow-[0_16px_20px_rgba(0,0,0,0.3)]" aria-label={t.product.chart} role="img" />
        </div>
        <div>
          <p className="mb-2 text-sm text-muted-foreground">{t.creator.chartLegend}</p>
          <div className="overflow-auto rounded-lg border border-line/15" dir="ltr">
            <canvas ref={chart} className="block h-auto w-full" style={{ imageRendering: "pixelated" }} aria-hidden="true" />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-xl bg-surface/70 p-5">
          <h3 className="text-lg">{t.creator.materials}</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {palette.map((hex, i) => (
              <li key={hex + i} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full ring-1 ring-line/30" style={{ backgroundColor: hex }} aria-hidden="true" />
                  {name(i)} <span className="text-muted-foreground" dir="ltr">{hex}</span>
                </span>
                <span className="tabular-nums">{t.creator.meters(meters(pattern.stitchesByColor[i]))}</span>
              </li>
            ))}
            <li className="border-t border-line/10 pt-2 text-muted-foreground">{t.creator.hook(presetFor("worsted").hookMm)}</li>
          </ul>
        </div>

        <div>
          <div className="flex items-center justify-between gap-3">
            <p className="font-medium" aria-live="polite">
              {doneCount === pattern.height ? t.creator.finished : t.creator.progressRows(doneCount, pattern.height)}
            </p>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2">
            <div className="h-full rounded-full bg-peach transition-[width] duration-500" style={{ width: `${(doneCount / pattern.height) * 100}%` }} />
          </div>
        </div>

        <p className="text-[15px]">{t.creator.foundation(pattern.foundation)}</p>

        <ol className="max-h-[70vh] space-y-1 overflow-y-auto pe-1">
          {pattern.rows.map((r, i) => {
            const key = `row:${r.number}`;
            const isDone = done.has(key);
            const text = ar ? r.runs.map((run) => `${run.count} مفردة ${name(run.color)}`).join("، ") : rowText(r, name);
            return (
              <li key={r.number} className="flex items-start gap-2">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={isDone}
                  aria-label={t.creator.markRowDone(r.number)}
                  onClick={() => toggle(key)}
                  className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition-colors ${isDone ? "border-peach bg-peach text-bg" : "border-line/30 hover:border-peach"}`}
                >
                  {isDone && (
                    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M4 10.5l4 4 8-9" />
                    </svg>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setCurrent(i)}
                  aria-current={current === i ? "step" : undefined}
                  className={`w-full rounded-lg px-3 py-1.5 text-start text-[14px] transition-colors ${current === i ? "bg-surface-2 ring-1 ring-peach/50" : "hover:bg-surface-2/60"} ${isDone ? "line-through decoration-peach/70 opacity-60" : ""}`}
                >
                  <span className="font-medium text-brand">
                    {t.creator.row} {r.number}
                  </span>{" "}
                  <span className="text-xs text-muted-foreground">({r.side === "RS" ? (ar ? "وجه" : "RS") : ar ? "ظهر" : "WS"})</span>
                  <span className="mt-0.5 block text-muted-foreground">{text}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
