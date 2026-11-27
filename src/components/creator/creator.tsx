"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { PatternViewer } from "@/components/viewer/pattern-viewer";
import { roundKey } from "@/components/viewer/pattern-list";
import dynamic from "next/dynamic";
import type { AiDesign } from "@/lib/ai/design";
import type { EnginePart, Pattern } from "@/lib/engine/types";
import { hasWebGL } from "@/lib/webgl";
import { UpgradeDialog } from "@/components/pricing/pricing-plans";
import { planOf, refundDesign, spendDesign, useDesignsLeft, useSubscription } from "@/lib/credits/plans";
import { useP } from "@/lib/i18n/pricing";
import { AnimatePresence } from "framer-motion";
import { guessMake, type Make } from "@/lib/viewer/piece";

const PieceScene = dynamic(() => import("@/components/viewer/piece-scene"), { ssr: false });
import { colorFromText, heightFor, matchTapestry, matchTemplate, recolor, TEMPLATES, type MakeType, type SizeChoice } from "@/lib/creator/templates";
import { estimate, generatePattern, presetFor, scaleSpec } from "@/lib/engine";
import type { EditorDoc } from "@/lib/editor/state";
import { buildPatternPdf, safeFileName } from "@/lib/export/pdf";
import type { Bi } from "@/lib/i18n/config";
import { useT } from "@/lib/i18n/client";
import { SITE_NAME } from "@/lib/site";
import type { DesignSpec } from "@/lib/spec/schema";
import { acceptable, chartFromImage, decode, dominantColors } from "@/lib/tapestry/from-image";
import { TAPESTRIES, type TapestryId } from "@/lib/tapestry/designs";
import { TapestryResult } from "./tapestry-result";
import { hashId, useProgress } from "./use-progress";

const TYPES: MakeType[] = ["toy", "bag", "clothes", "wall", "flat", "other"];
const SIZES: SizeChoice[] = ["small", "medium", "large"];
const LAST_KEY = "loopera-creator-last-v1";
export const HANDOFF_KEY = "loopera-editor-handoff";

type Result =
  | { kind: "template"; id: string; templateKey: string; title: Bi; spec: DesignSpec; height: number; fromPhoto: boolean; ai?: "ok" | "fallback" | "off"; make?: Make }
  | { kind: "wall"; id: string; title: Bi; grid: number[][]; palette: string[]; names: Bi[]; fromPhoto: boolean };

function loadLast(): Result | null {
  try {
    const v = JSON.parse(localStorage.getItem(LAST_KEY) ?? "null") as Result | null;
    if (v && (v.kind === "template" || v.kind === "wall") && typeof v.id === "string") return v;
  } catch {
    // ignore
  }
  return null;
}

/** The photo for the AI: at most 1024 px on its longest side, as a JPEG data URL. */
function toDataUrl(img: ImageBitmap): string {
  const k = Math.min(1, 1024 / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = Math.round(img.width * k);
  c.height = Math.round(img.height * k);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.85);
}

function tapestryResult(id: TapestryId): Result {
  const d = TAPESTRIES[id];
  return {
    kind: "wall",
    id: `wall-${id}`,
    title: { en: "Wall hanging", ar: "لوحة جدارية" },
    grid: d.grid,
    palette: d.palette.map((p) => p.hex),
    names: d.palette.map((p) => p.name),
    fromPhoto: false,
  };
}

export function Creator({ initialTapestry, initialType = null }: { initialTapestry: TapestryId | null; initialType?: MakeType | null }) {
  const { t, bi, locale } = useT();
  const ar = locale === "ar";
  const [type, setType] = useState<MakeType>(initialTapestry ? "wall" : (initialType ?? "toy"));
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [size, setSize] = useState<SizeChoice>("medium");
  const [width, setWidth] = useState(36);
  const [colors, setColors] = useState(4);
  const [aiReady, setAiReady] = useState<boolean | null>(null);
  const [upgrade, setUpgrade] = useState(false);
  const p = useP();
  const sub = useSubscription();
  const left = useDesignsLeft();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const resultRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const progress = useProgress(result?.id ?? null);

  useEffect(() => {
    fetch("/api/design")
      .then((r) => r.json())
      .then((j: { ai: string | null }) => setAiReady(!!j.ai))
      .catch(() => setAiReady(false));
    if (initialTapestry) setResult(tapestryResult(initialTapestry));
    else setResult(loadLast());
  }, [initialTapestry]);

  useEffect(() => {
    if (!file) return setPreview(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const pick = (f: File | undefined) => {
    setError(null);
    if (!f) return;
    if (!acceptable(f)) {
      setError(t.creator.badFile);
      return;
    }
    setFile(f);
  };

  const generate = async () => {
    setError(null);
    const words = text.trim().slice(0, 500);
    if (!file && words.length < 2) {
      setError(t.creator.needInput);
      return;
    }
    // Each new design uses one of the month's designs; when they run out, show the plans.
    if (!spendDesign()) {
      setUpgrade(true);
      return;
    }
    setBusy(true);
    try {
      const img = file ? await decode(file) : null;
      let next: Result;
      if (type === "wall") {
        if (img) {
          const { grid, palette } = chartFromImage(img, width, colors);
          next = {
            kind: "wall",
            id: `photo-${hashId(grid.map((r) => r.join("")).join("|") + palette.join())}`,
            title: { en: "Your wall hanging", ar: "لوحتك الجدارية" },
            grid,
            palette,
            names: palette.map((_, i) => ({ en: `Color ${String.fromCharCode(65 + i)}`, ar: `لون ${String.fromCharCode(65 + i)}` })),
            fromPhoto: true,
          };
        } else {
          next = tapestryResult(matchTapestry(words));
        }
      } else {
        const tpl = matchTemplate(type, words);
        // AI first: it reads the parts, proportions and colours from the photo; the engine computes the rounds.
        let ai: AiDesign | null = null;
        let aiState: "ok" | "fallback" | "off" = aiReady ? "fallback" : "off";
        if (aiReady) {
          try {
            const res = await fetch("/api/design", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ kind: type, size, text: words, image: img ? toDataUrl(img) : null }),
            });
            if (res.ok) {
              ai = ((await res.json()) as { design: AiDesign }).design;
              aiState = "ok";
            } else if (res.status === 503) aiState = "off";
            else {
              // The AI is connected but could not answer: say so, give the design back, show nothing made up.
              const reason = ((await res.json().catch(() => ({}))) as { error?: string }).error;
              refundDesign();
              img?.close();
              setError(reason === "busy" ? t.creator.aiBusy : reason === "key" ? t.creator.aiKey : reason === "limit" ? t.creator.aiLimit : t.creator.aiFailed);
              return;
            }
          } catch {
            refundDesign();
            img?.close();
            setError(t.creator.aiFailed);
            return;
          }
        }
        if (ai) {
          next = {
            kind: "template",
            id: `ai-${hashId(JSON.stringify(ai.spec) + ai.heightCm)}`,
            templateKey: "ai",
            title: ai.title,
            spec: ai.spec,
            height: Math.round(ai.heightCm),
            fromPhoto: !!img,
            ai: aiState,
            make: type,
          };
        } else {
          const fromText = colorFromText(words);
          const picked = img ? dominantColors(img, 2) : [];
          const palette = fromText ? [fromText, ...picked.slice(0, 1)] : picked;
          const spec = recolor(tpl.spec, palette);
          const height = heightFor(tpl, size);
          next = {
            kind: "template",
            id: `${tpl.key}-${hashId(JSON.stringify(spec) + height)}`,
            templateKey: tpl.key,
            title: tpl.name,
            spec,
            height,
            fromPhoto: !!img,
            ai: aiState,
            make: type,
          };
        }
      }
      img?.close();
      setResult(next);
      try {
        localStorage.setItem(LAST_KEY, JSON.stringify(next));
      } catch {
        // too big or blocked: the result still shows
      }
      requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch {
      setError(t.creator.badFile);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-5 pb-24 pt-36 sm:px-8 sm:pt-32">
      <header className="max-w-2xl">
        <h1 className="text-4xl sm:text-6xl">{t.creator.title}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{t.creator.intro}</p>
      </header>

      <section aria-labelledby="step-type" className="mt-14">
        <h2 id="step-type" className="text-2xl">
          {t.creator.step1}
        </h2>
        <div role="radiogroup" aria-labelledby="step-type" className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {TYPES.map((k) => {
            const on = type === k;
            return (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setType(k)}
                className={`rounded-lg border px-4 py-4 text-start transition-colors ${on ? "border-primary bg-primary/10" : "border-line/15 bg-surface/50 hover:border-line/40"}`}
              >
                <span className="block text-lg font-medium">{t.creator.types[k].label}</span>
                <span className="mt-1 block text-sm text-muted-foreground">{t.creator.types[k].hint}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="step-input" className="mt-14">
        <h2 id="step-input" className="text-2xl">
          {t.creator.step2}
        </h2>
        <div className="mt-5 grid gap-6 md:grid-cols-2">
          <div>
            <label
              htmlFor="creator-photo"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                pick(e.dataTransfer.files[0]);
              }}
              className="flex min-h-[220px] cursor-pointer flex-col items-center justify-center gap-3 overflow-hidden rounded-lg border border-dashed border-line/30 bg-surface/50 p-4 text-center transition-colors hover:border-primary focus-within:border-primary"
            >
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="" className="max-h-56 w-auto rounded-md object-contain" />
              ) : (
                <>
                  <svg viewBox="0 0 24 24" className="h-8 w-8 text-brand" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M4 16l4.5-4.5a2 2 0 0 1 2.8 0L16 16m-2-2 1.5-1.5a2 2 0 0 1 2.8 0L20 14M4 6h16v12H4z" />
                  </svg>
                  <span className="font-medium">{t.creator.upload}</span>
                  <span className="text-sm text-muted-foreground">{t.creator.uploadHint}</span>
                </>
              )}
              <input id="creator-photo" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
            </label>
            {file && (
              <button type="button" onClick={() => setFile(null)} className="mt-2 text-sm text-muted-foreground underline underline-offset-4 hover:text-fg">
                {t.creator.removePhoto}
              </button>
            )}
          </div>

          <div className="flex flex-col gap-5">
            <div>
              <label htmlFor="creator-text" className="font-medium">
                {t.creator.describe}
              </label>
              <textarea
                id="creator-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={500}
                rows={4}
                placeholder={t.creator.describePlaceholder}
                className="mt-2 w-full resize-y rounded-lg border border-line/20 bg-surface/60 px-4 py-3 text-base placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none"
              />
            </div>

            {type === "wall" ? (
              <div className="grid grid-cols-2 gap-4">
                <label className="text-sm">
                  <span className="flex justify-between font-medium">
                    {t.creator.chartWidth} <span className="tabular-nums text-muted-foreground">{width}</span>
                  </span>
                  <input type="range" min={20} max={60} step={2} value={width} onChange={(e) => setWidth(Number(e.target.value))} className="mt-2 w-full accent-[rgb(var(--primary))]" />
                </label>
                <label className="text-sm">
                  <span className="flex justify-between font-medium">
                    {t.creator.chartColors} <span className="tabular-nums text-muted-foreground">{colors}</span>
                  </span>
                  <input type="range" min={2} max={6} value={colors} onChange={(e) => setColors(Number(e.target.value))} className="mt-2 w-full accent-[rgb(var(--primary))]" />
                </label>
              </div>
            ) : (
              <fieldset>
                <legend className="font-medium">{t.creator.height}</legend>
                <div className="mt-2 flex gap-2">
                  {SIZES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      aria-pressed={size === s}
                      onClick={() => setSize(s)}
                      className={`min-h-11 flex-1 rounded-lg border px-3 text-sm transition-colors ${size === s ? "border-primary bg-primary/10" : "border-line/20 hover:border-line/40"}`}
                    >
                      {t.creator.sizes[s]}
                    </button>
                  ))}
                </div>
              </fieldset>
            )}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
          <button
            type="button"
            onClick={generate}
            disabled={busy}
            className="min-h-12 rounded-sm bg-primary px-8 text-base font-medium text-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? (file && aiReady && type !== "wall" ? t.creator.aiReading : t.creator.generating) : t.creator.generate}
          </button>
          {left !== null && (
            <p className="text-sm text-muted-foreground" aria-live="polite">
              <span className="font-medium text-fg">{p.planLine(p.names[sub.plan])}</span> · {p.left(left, planOf(sub.plan).designs)}
              <Link href="/pricing" className="ms-2 underline underline-offset-4 hover:text-fg">
                {sub.plan === "max" ? p.seePlans : p.upgrade}
              </Link>
            </p>
          )}
        </div>
        {error && (
          <p role="alert" className="mt-4 text-sm text-ember">
            {error}
          </p>
        )}
      </section>

      <AnimatePresence>{upgrade && <UpgradeDialog onClose={() => setUpgrade(false)} />}</AnimatePresence>

      {result && (
        <section ref={resultRef} aria-labelledby="step-result" className="mt-20 scroll-mt-24 border-t border-line/10 pt-12">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 id="step-result" className="text-3xl sm:text-4xl">
                {bi(result.title)}
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                {result.kind === "wall" ? (result.fromPhoto ? t.creator.photoNote : t.creator.chartLegend) : result.ai === "ok" ? `${t.creator.aiNote}${result.spec.notes ? ` ${result.spec.notes}` : ""}` : result.ai === "fallback" ? t.creator.aiFallback : t.creator.templateNote}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {progress.done.size > 0 && (
                <button type="button" onClick={progress.clear} className="min-h-10 rounded-sm border border-line/20 px-4 text-sm hover:border-line/50">
                  {t.creator.resetProgress}
                </button>
              )}
              {result.kind === "template" && (
                <>
                  <button
                    type="button"
                    disabled={pdfBusy}
                    onClick={async () => {
                      setPdfBusy(true);
                      try {
                        const preset = presetFor("worsted");
                        const pattern = generatePattern(result.spec, result.height, preset.gauge);
                        let cover: string | null = null;
                        try {
                          cover = canvasRef.current?.toDataURL("image/png") ?? null;
                        } catch {
                          cover = null;
                        }
                        const pdf = await buildPatternPdf({
                          title: result.title.en,
                          pattern,
                          estimates: estimate(pattern, preset.gauge),
                          terms: "us",
                          targetHeightCm: result.height,
                          gaugeLabel: preset.label,
                          hookMm: preset.hookMm,
                          coverImage: cover,
                          siteName: SITE_NAME,
                        });
                        pdf.save(`${safeFileName(result.title.en)}.pdf`);
                      } finally {
                        setPdfBusy(false);
                      }
                    }}
                    className="min-h-10 rounded-sm border border-line/20 px-4 text-sm hover:border-line/50 disabled:opacity-50"
                  >
                    {t.creator.exportPdf}
                  </button>
                  <Link
                    href="/creator/editor?start=creator"
                    onClick={() => {
                      const doc: EditorDoc = { title: result.title.en, spec: result.spec, targetHeightCm: result.height, gauge: { kind: "preset", weight: "worsted" }, terms: "us" };
                      try {
                        sessionStorage.setItem(HANDOFF_KEY, JSON.stringify(doc));
                      } catch {
                        // the editor falls back to a blank start
                      }
                    }}
                    className="flex min-h-10 items-center rounded-sm border border-line/20 px-4 text-sm hover:border-line/50"
                  >
                    {t.creator.editParts}
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="mt-10">
            {result.kind === "wall" ? (
              <TapestryResult grid={result.grid} palette={result.palette} names={result.names} done={progress.done} toggle={progress.toggle} />
            ) : (
              <TemplateResult result={result} progress={progress} onCanvas={(c) => (canvasRef.current = c)} ar={ar} />
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function TemplateResult({
  result,
  progress,
  onCanvas,
  ar,
}: {
  result: Extract<Result, { kind: "template" }>;
  progress: ReturnType<typeof useProgress>;
  onCanvas: (c: HTMLCanvasElement | null) => void;
  ar: boolean;
}) {
  const { t } = useT();
  const preset = presetFor("worsted");
  const pattern = useMemo(() => generatePattern(result.spec, result.height, preset.gauge), [result, preset.gauge]);
  const parts = useMemo(() => scaleSpec(result.spec, result.height), [result]);
  const est = useMemo(() => estimate(pattern, preset.gauge), [pattern, preset.gauge]);
  const total = pattern.parts.reduce((n, p) => n + p.rounds.length, 0);
  const doneCount = pattern.parts.reduce((n, p) => n + p.rounds.filter((r) => progress.done.has(roundKey(p.partId, r.number))).length, 0);
  const hours = est.minutes >= 60 ? `${Math.round((est.minutes / 60) * 2) / 2} ${ar ? "ساعة" : "h"}` : `${est.minutes} ${ar ? "دقيقة" : "min"}`;
  const tplName = TEMPLATES.find((x) => x.key === result.templateKey);

  const make: Make = result.make ?? (tplName ? tplName.type : guessMake(parts));
  return (
    <div className="space-y-8">
      <FormingPiece pattern={pattern} parts={parts} make={make} rowHeightCm={preset.gauge.rowHeightCm} stitchWidthCm={preset.gauge.stitchWidthCm} />
      <div className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <p className="font-medium" aria-live="polite">
            {doneCount === total ? t.creator.finished : t.creator.progress(doneCount, total)}
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2">
            <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${total ? (doneCount / total) * 100 : 0}%` }} />
          </div>
        </div>
        <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
          {tplName && <li>{t.creator.matched(ar ? tplName.name.ar : tplName.name.en)}</li>}
          <li>{t.creator.hook(preset.hookMm)}</li>
          {est.yarnByColor.map((y) => (
            <li key={y.colorHex} className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full ring-1 ring-line/30" style={{ backgroundColor: y.colorHex }} aria-hidden="true" />
              {t.creator.meters(y.meters)}
            </li>
          ))}
          <li>{t.creator.time(hours)}</li>
        </ul>
      </div>
      <PatternViewer pattern={pattern} parts={parts} rowHeightCm={preset.gauge.rowHeightCm} terms="us" onCanvas={onCanvas} progress={progress} allowAssembly={false} />
    </div>
  );
}

/** The finished piece in 3D, forming stitch by stitch in the order it is worked. */
function FormingPiece(props: { pattern: Pattern; parts: EnginePart[]; make: Make; rowHeightCm: number; stitchWidthCm: number }) {
  const { t } = useT();
  const [gl, setGl] = useState<boolean | null>(null);
  const [run, setRun] = useState(0);
  const [done, setDone] = useState(false);
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    setGl(hasWebGL());
    setReduce(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);
  useEffect(() => setDone(false), [props.pattern, run]);
  if (gl === false) return null;
  return (
    <div className="overflow-hidden rounded-2xl bg-surface/60 ring-1 ring-line/10">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4">
        <div>
          <h3 className="font-serif text-xl">{t.creator.pieceTitle}</h3>
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {done ? t.creator.pieceDone : t.creator.pieceForming}
          </p>
        </div>
        <button type="button" onClick={() => setRun((r) => r + 1)} className="min-h-10 rounded-full border border-line/20 px-4 text-sm hover:border-line/50">
          {t.creator.replay}
        </button>
      </div>
      <div className="h-[380px] sm:h-[460px]">{gl && <PieceScene {...props} run={run} reduceMotion={reduce} onDone={() => setDone(true)} />}</div>
    </div>
  );
}
