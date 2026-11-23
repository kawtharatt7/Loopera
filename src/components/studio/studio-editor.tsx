"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { PatternViewer } from "@/components/viewer/pattern-viewer";
import { Button } from "@/components/ui/button";
import { CREDIT_COSTS } from "@/lib/credits/constants";
import { estimate, gaugeFromSwatch, generatePattern, presetFor, scaleSpec, YARN_PRESETS } from "@/lib/engine";
import type { YarnWeight } from "@/lib/engine/gauge";
import type { Gauge, Pattern } from "@/lib/engine/types";
import { historyReducer, inferCategory, makePart, removePart, SHAPE_DEFAULTS, type EditorDoc, type History } from "@/lib/editor/state";
import { buildPatternPdf, PRINT_PAPER, safeFileName } from "@/lib/export/pdf";
import { canvasToPng, downloadDataUrl, svgToPng } from "@/lib/export/png";
import { DesignSpecSchema, PART_SHAPES, qualityLevel, type PartSpec } from "@/lib/spec/schema";
import { SITE_NAME } from "@/lib/site";
import { Panel, SelectField, SliderField } from "./fields";
import { PartCard } from "./part-card";

export interface StudioEditorProps {
  initial: EditorDoc;
  /** Called before a PDF export; resolve false to cancel (used for credits). */
  onBeforePdf?: () => Promise<boolean>;
  /** Called (debounced) whenever the document changes, for saving. */
  onChange?: (doc: EditorDoc) => void;
  saveState?: "idle" | "saving" | "saved" | "error";
}

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setV(value), ms);
    return () => window.clearTimeout(id);
  }, [value, ms]);
  return v;
}

function resolveGauge(doc: EditorDoc): { gauge: Gauge; hookMm: number; label: string } {
  if (doc.gauge.kind === "preset") {
    const p = presetFor(doc.gauge.weight);
    return { gauge: p.gauge, hookMm: p.hookMm, label: `${p.label}, approx. ${(10 / p.gauge.stitchWidthCm).toFixed(0)} sc × ${(10 / p.gauge.rowHeightCm).toFixed(0)} rows per 10 cm` };
  }
  const g = gaugeFromSwatch(doc.gauge.stitchesPer10cm, doc.gauge.rowsPer10cm);
  // Hook guess from stitch width; real hooks vary, labelled approximate.
  const hookMm = Math.round(g.stitchWidthCm * 6 * 2) / 2;
  return { gauge: g, hookMm, label: `${doc.gauge.stitchesPer10cm} sc × ${doc.gauge.rowsPer10cm} rows per 10 cm (measured)` };
}

type Computed =
  | { ok: true; pattern: Pattern; error: null }
  | { ok: false; pattern: Pattern | null; error: string };

export function StudioEditor({ initial, onBeforePdf, onChange, saveState = "idle" }: StudioEditorProps) {
  const [history, dispatch] = useReducer(
    (s: History, a: Parameters<typeof historyReducer>[1]) => historyReducer(s, a),
    { past: [], present: initial, future: [] },
  );
  const doc = history.present;
  const debounced = useDebounced(doc, 120);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastGood = useRef<Pattern | null>(null);
  const [busy, setBusy] = useState<"pdf" | "png" | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [newShape, setNewShape] = useState<(typeof PART_SHAPES)[number]>("sphere");

  const update = useCallback((next: EditorDoc, coalesceKey?: string) => dispatch({ type: "set", doc: next, coalesceKey }), []);

  useEffect(() => {
    onChange?.(debounced);
  }, [debounced, onChange]);

  // Keyboard: Ctrl/Cmd+Z undo, Ctrl/Cmd+Shift+Z or Ctrl+Y redo (not while typing in a text box).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" && (t as HTMLInputElement).type === "text")) return;
      if (!(e.metaKey || e.ctrlKey)) return;
      const k = e.key.toLowerCase();
      if (k === "z" && !e.shiftKey) {
        e.preventDefault();
        dispatch({ type: "undo" });
      } else if ((k === "z" && e.shiftKey) || k === "y") {
        e.preventDefault();
        dispatch({ type: "redo" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const g = useMemo(() => resolveGauge(debounced), [debounced]);
  const scale = doc.targetHeightCm / doc.spec.overallHeightRatio;

  // Live recalculation: no AI, no credits. A bad value keeps the last good pattern on screen.
  const computed: Computed = useMemo(() => {
    const parsed = DesignSpecSchema.safeParse(debounced.spec);
    if (!parsed.success) {
      return { ok: false, pattern: lastGood.current, error: parsed.error.issues[0]?.message ?? "Something in the parts list needs a look." };
    }
    try {
      const pattern = generatePattern(parsed.data, debounced.targetHeightCm, g.gauge);
      lastGood.current = pattern;
      return { ok: true, pattern, error: null };
    } catch (e) {
      return { ok: false, pattern: lastGood.current, error: e instanceof Error ? e.message : "This size could not be calculated." };
    }
  }, [debounced, g.gauge]);

  const engineParts = useMemo(() => {
    try {
      return scaleSpec(debounced.spec, debounced.targetHeightCm);
    } catch {
      return [];
    }
  }, [debounced]);

  const pattern = computed.pattern;
  const est = useMemo(() => (pattern ? estimate(pattern, g.gauge) : null), [pattern, g.gauge]);
  const level = qualityLevel(doc.spec);

  const setParts = (parts: PartSpec[], key?: string) => {
    const spec = { ...doc.spec, parts };
    update({ ...doc, spec: { ...spec, category: inferCategory(spec) } }, key);
  };

  const previewPng = async (background?: string, jpeg = false): Promise<string | null> => {
    if (canvasRef.current) return canvasToPng(canvasRef.current, background, jpeg ? "image/jpeg" : "image/png");
    const svg = document.querySelector<SVGSVGElement>("[data-stage] svg");
    return svg ? svgToPng(svg) : null;
  };

  const exportPng = async () => {
    setBusy("png");
    setNotice(null);
    try {
      const url = await previewPng();
      if (!url) throw new Error("The preview is not ready yet.");
      downloadDataUrl(url, `${safeFileName(doc.title)}.png`);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "The image could not be made. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  const exportPdf = async () => {
    if (!pattern || !est) return;
    setBusy("pdf");
    setNotice(null);
    try {
      if (onBeforePdf && !(await onBeforePdf())) return;
      const cover = await previewPng(PRINT_PAPER, true).catch(() => null);
      const pdf = await buildPatternPdf({
        title: doc.title || "My crochet pattern",
        pattern,
        estimates: est,
        terms: doc.terms,
        targetHeightCm: doc.targetHeightCm,
        gaugeLabel: g.label,
        hookMm: g.hookMm,
        coverImage: cover,
        siteName: SITE_NAME,
      });
      pdf.save(`${safeFileName(doc.title)}.pdf`);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "The PDF could not be made. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mx-auto max-w-[1500px] px-4 pb-20 pt-24 sm:px-6">
      {/* Top bar */}
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="design-title" className="sr-only">
          Design title
        </label>
        <input
          id="design-title"
          value={doc.title}
          maxLength={80}
          onChange={(e) => update({ ...doc, title: e.target.value }, "title")}
          placeholder="Name your design"
          className="min-h-12 min-w-0 flex-1 basis-full rounded-2xl sm:basis-auto border border-transparent bg-transparent px-2 font-serif text-3xl outline-none transition-colors hover:border-line/15 focus:border-line/25"
        />
        <span className="text-sm text-muted-foreground" aria-live="polite">
          {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : saveState === "error" ? "Not saved, will retry" : ""}
        </span>
        <div className="flex items-center gap-1 rounded-full border border-line/15 bg-surface/60 p-1">
          <button type="button" onClick={() => dispatch({ type: "undo" })} disabled={history.past.length === 0} aria-label="Undo" title="Undo (Ctrl+Z)" className="h-10 w-10 cursor-pointer rounded-full hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-40">
            <svg viewBox="0 0 20 20" className="mx-auto h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M7 5 3 9l4 4M3 9h9a5 5 0 0 1 0 10h-2" /></svg>
          </button>
          <button type="button" onClick={() => dispatch({ type: "redo" })} disabled={history.future.length === 0} aria-label="Redo" title="Redo (Ctrl+Shift+Z)" className="h-10 w-10 cursor-pointer rounded-full hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-40">
            <svg viewBox="0 0 20 20" className="mx-auto h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="m13 5 4 4-4 4M17 9H8a5 5 0 0 0 0 10h2" /></svg>
          </button>
        </div>
        <div role="radiogroup" aria-label="Stitch terms" className="flex rounded-full border border-line/15 bg-surface/60 p-1 text-sm">
          {(["us", "uk"] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={doc.terms === t}
              onClick={() => update({ ...doc, terms: t })}
              className={`min-h-10 cursor-pointer rounded-full px-4 ${doc.terms === t ? "bg-primary text-primary-fg" : "hover:bg-surface-2"}`}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {level === 3 && (
        <p role="status" className="mt-4 rounded-2xl border border-peach/40 bg-peach/10 px-4 py-3 text-sm">
          <strong>Needs review.</strong> This piece is outside what the engine can check fully, so it is a written draft without 3D. Read it through before you start.
        </p>
      )}
      {!computed.ok && (
        <p role="alert" className="mt-4 rounded-2xl border border-ember/40 bg-ember/10 px-4 py-3 text-sm">
          {computed.error} {pattern ? "Showing the last pattern that worked." : ""}
        </p>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        {/* Controls */}
        <aside className="space-y-4" aria-label="Design controls">
          <Panel
            title="Parts"
            action={<span className="text-xs text-muted-foreground">Editing is free</span>}
          >
            <ul className="space-y-2">
              {doc.spec.parts.map((p, i) => (
                <PartCard
                  key={p.id}
                  part={p}
                  others={doc.spec.parts.filter((o) => o.id !== p.id)}
                  scale={scale}
                  defaultOpen={i === 0}
                  canRemove={doc.spec.parts.length > 1}
                  onChange={(next, key) => setParts(doc.spec.parts.map((x) => (x.id === p.id ? next : x)), key)}
                  onRemove={() => update({ ...doc, spec: removePart(doc.spec, p.id) })}
                  onDuplicate={() => {
                    const copy = { ...makePart(doc.spec.parts, p.shape, p.colorHex), name: `${p.name} copy`, dims: { ...p.dims }, attachTo: p.attachTo, position: { ...p.position }, quantity: p.quantity };
                    setParts([...doc.spec.parts, copy]);
                  }}
                />
              ))}
            </ul>
            <div className="flex gap-2">
              <div className="flex-1">
                <SelectField
                  label="New part shape"
                  value={newShape}
                  options={PART_SHAPES.map((s) => ({ value: s, label: SHAPE_DEFAULTS[s].label }))}
                  onChange={setNewShape}
                />
              </div>
              <Button
                variant="secondary"
                className="self-end"
                onClick={() => setParts([...doc.spec.parts, makePart(doc.spec.parts, newShape, doc.spec.parts[0]?.colorHex ?? "#CE4F2F")])}
                disabled={doc.spec.parts.length >= 24}
              >
                Add part
              </Button>
            </div>
          </Panel>

          <Panel title="Size and gauge">
            <SliderField
              label="Overall height (scales every part)"
              unit="cm"
              value={doc.targetHeightCm}
              min={3}
              max={80}
              step={0.5}
              onChange={(v) => update({ ...doc, targetHeightCm: v }, "height")}
            />
            <div role="radiogroup" aria-label="Gauge source" className="flex rounded-full border border-line/15 bg-bg/50 p-1 text-sm">
              {(["preset", "swatch"] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  role="radio"
                  aria-checked={doc.gauge.kind === k}
                  onClick={() =>
                    update({
                      ...doc,
                      gauge: k === "preset" ? { kind: "preset", weight: "worsted" } : { kind: "swatch", stitchesPer10cm: 15, rowsPer10cm: 16 },
                    })
                  }
                  className={`min-h-10 flex-1 cursor-pointer rounded-full ${doc.gauge.kind === k ? "bg-primary text-primary-fg" : "hover:bg-surface-2"}`}
                >
                  {k === "preset" ? "Yarn weight" : "My swatch"}
                </button>
              ))}
            </div>
            {doc.gauge.kind === "preset" ? (
              <>
                <SelectField<YarnWeight>
                  label="Yarn weight"
                  value={doc.gauge.weight}
                  options={YARN_PRESETS.map((y) => ({ value: y.weight, label: `${y.label}, ${y.hookMm} mm hook` }))}
                  onChange={(weight) => update({ ...doc, gauge: { kind: "preset", weight } })}
                />
                <p className="text-xs text-muted-foreground">Preset gauges are approximate. Measure a swatch for an exact fit.</p>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <SliderField label="Stitches / 10 cm" value={doc.gauge.stitchesPer10cm} min={4} max={40} step={0.5} onChange={(v) => doc.gauge.kind === "swatch" && update({ ...doc, gauge: { ...doc.gauge, stitchesPer10cm: v } }, "sw-s")} />
                <SliderField label="Rows / 10 cm" value={doc.gauge.rowsPer10cm} min={4} max={40} step={0.5} onChange={(v) => doc.gauge.kind === "swatch" && update({ ...doc, gauge: { ...doc.gauge, rowsPer10cm: v } }, "sw-r")} />
              </div>
            )}
          </Panel>

          {est && (
            <Panel title="Estimates" action={<span className="text-xs text-muted-foreground">Approximate</span>}>
              <ul className="space-y-2 text-sm">
                {est.yarnByColor.map((c) => (
                  <li key={c.colorHex} className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="h-3.5 w-3.5 rounded-full ring-1 ring-line/20" style={{ backgroundColor: c.colorHex }} aria-hidden="true" />
                      {c.colorHex}
                    </span>
                    <span className="tabular-nums">≈ {c.meters} m</span>
                  </li>
                ))}
                <li className="flex justify-between border-t border-line/10 pt-2">
                  <span className="text-muted-foreground">Hook</span>
                  <span>{g.hookMm} mm</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Working time</span>
                  <span>≈ {est.minutes >= 90 ? `${(est.minutes / 60).toFixed(1)} h` : `${est.minutes} min`}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Stitches</span>
                  <span className="tabular-nums">{pattern?.totalStitches.toLocaleString("en")}</span>
                </li>
              </ul>
            </Panel>
          )}

          <Panel title="Export">
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={exportPdf} disabled={!pattern || busy !== null} aria-describedby="pdf-cost">
                {busy === "pdf" ? "Making PDF…" : "PDF pattern"}
              </Button>
              <Button variant="secondary" onClick={exportPng} disabled={!pattern || busy !== null}>
                {busy === "png" ? "Saving…" : "PNG preview"}
              </Button>
            </div>
            <p id="pdf-cost" className="text-xs text-muted-foreground">
              PDF costs {CREDIT_COSTS.pdfExport} credit. PNG is free.
            </p>
            {notice && (
              <p role="alert" className="text-sm text-brand">
                {notice}
              </p>
            )}
          </Panel>

          {doc.spec.parts[0] && doc.spec.parts.length === 1 && (
            <p className="px-2 text-xs text-muted-foreground">Tip: add ears, arms or a body with “Add part”, then attach them in each part’s settings.</p>
          )}
        </aside>

        {/* Viewer and written pattern */}
        <div>
          {pattern ? (
            <PatternViewer
              pattern={pattern}
              parts={engineParts}
              rowHeightCm={g.gauge.rowHeightCm}
              terms={doc.terms}
              allow3D={level !== 3}
              onCanvas={(c) => {
                canvasRef.current = c;
              }}
            />
          ) : (
            <div className="rounded-2xl border border-line/10 bg-surface/50 p-10 text-center text-muted-foreground">Add a part to see your pattern.</div>
          )}
        </div>
      </div>
    </div>
  );
}
