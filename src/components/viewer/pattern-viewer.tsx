"use client";

import dynamic from "next/dynamic";
import { useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import type { EnginePart, Pattern } from "@/lib/engine/types";
import type { Terms } from "@/lib/engine/terms";
import { hasWebGL } from "@/lib/webgl";
import { useT } from "@/lib/i18n/client";
import { partNameAr } from "@/lib/engine/arabic";
import { FlatChart, ProfileView } from "./flat-views";
import { PatternList, type RoundProgress } from "./pattern-list";
import { SPEEDS, usePlayback, type Speed } from "./use-playback";

const StitchScene = dynamic(() => import("./stitch-scene"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-2xl bg-surface-2/50" />,
});

interface PatternViewerProps {
  pattern: Pattern;
  parts: EnginePart[];
  rowHeightCm: number;
  terms: Terms;
  onCanvas?: (canvas: HTMLCanvasElement | null) => void;
  /** Level 3 pieces get a written draft only, no 3D. */
  allow3D?: boolean;
  /** Tick boxes for finished rounds. */
  progress?: RoundProgress;
  /** Show the tab with every part placed together (off where the finished piece is shown above). */
  allowAssembly?: boolean;
}

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

export function PatternViewer({ pattern, parts, rowHeightCm, terms, onCanvas, allow3D = true, allowAssembly = true, progress }: PatternViewerProps) {
  const reduce = useReducedMotion() ?? false;
  const { t, locale } = useT();
  const ar = locale === "ar";
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const [compact, setCompact] = useState(false);
  const [activeId, setActiveId] = useState(pattern.parts[0]?.partId ?? "");
  const [view, setView] = useState<"part" | "assembly">("part");
  const [explode, setExplode] = useState(false);

  useEffect(() => {
    setWebgl(hasWebGL());
    setCompact(window.innerWidth < 768);
  }, []);

  // Keep a valid part selected while the user edits the list of parts.
  const active = pattern.parts.find((p) => p.partId === activeId) ?? pattern.parts[0];
  useEffect(() => {
    if (active && active.partId !== activeId) setActiveId(active.partId);
  }, [active, activeId]);

  const total = active?.rounds.length ?? 1;
  const { round, setRound, playing, setPlaying, toggle, speed, setSpeed } = usePlayback(total);

  const hasRevolution = pattern.parts.some((p) => p.kind === "revolution");
  const hasAttachments = parts.some((p) => p.attachTo);
  const use3D = allow3D && webgl === true && active?.kind === "revolution";

  const mode = useMemo(
    () =>
      view === "assembly"
        ? ({ kind: "assembly", pattern, parts, explode } as const)
        : active
          ? ({ kind: "part", part: active, round } as const)
          : null,
    [view, pattern, parts, explode, active, round],
  );

  useEffect(() => {
    if (!use3D && view === "part") onCanvas?.(null);
  }, [use3D, view, onCanvas]);

  if (!active || !mode) return null;

  const pick = (partId: string, r: number) => {
    setView("part");
    setPlaying(false);
    if (partId !== active.partId) setActiveId(partId);
    // Wait for the new part's playback range before jumping.
    window.setTimeout(() => setRound(r), 0);
  };

  return (
    <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <div className="2xl:sticky 2xl:top-24 2xl:self-start">
        {/* Part tabs */}
        <div role="tablist" aria-label="Parts" className="flex flex-wrap gap-2">
          {pattern.parts.map((p) => (
            <button
              key={p.partId}
              role="tab"
              type="button"
              aria-selected={view === "part" && p.partId === active.partId}
              onClick={() => {
                setView("part");
                setActiveId(p.partId);
                setPlaying(false);
              }}
              className={`inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-sm px-4 text-sm transition-colors ${
                view === "part" && p.partId === active.partId ? "bg-primary text-primary-fg" : "border border-line/15 bg-surface/60 hover:bg-surface-2"
              }`}
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.colorHex }} aria-hidden="true" />
              {ar ? partNameAr(p.name) : p.name}
            </button>
          ))}
          {allowAssembly && allow3D && webgl && hasRevolution && hasAttachments && (
            <button
              role="tab"
              type="button"
              aria-selected={view === "assembly"}
              onClick={() => {
                setView("assembly");
                setPlaying(false);
              }}
              className={`inline-flex min-h-10 cursor-pointer items-center rounded-sm px-4 text-sm transition-colors ${
                view === "assembly" ? "bg-primary text-primary-fg" : "border border-line/15 bg-surface/60 hover:bg-surface-2"
              }`}
            >
              {ar ? "كل القطع مع بعض" : "All parts together"}
            </button>
          )}
        </div>

        {/* Stage */}
        <div data-stage className="relative mt-4 aspect-square max-h-[68vh] w-full overflow-hidden rounded-2xl border border-line/10 bg-bg/70 sm:aspect-[4/3.2]">
          {view === "assembly" || use3D ? (
            <StitchScene mode={mode} rowHeightCm={rowHeightCm} playing={playing} reduceMotion={reduce} compact={compact} onCanvas={onCanvas} />
          ) : active.kind === "revolution" ? (
            <div className="h-full p-6">
              <ProfileView part={active} round={round} onPick={setRound} />
            </div>
          ) : (
            <div className="h-full p-6">
              <FlatChart part={active} round={round} onPick={setRound} />
            </div>
          )}
          {view === "part" && (
            <div className="pointer-events-none absolute left-4 top-4 rounded-sm bg-surface/85 px-3 py-1.5 text-sm backdrop-blur">
              <span className="text-muted-foreground">{active.kind === "rectangle" ? t.creator.row : t.creator.round}</span>{" "}
              <span className="font-medium tabular-nums">
                {round + 1} / {total}
              </span>
              <span className="text-muted-foreground">, </span>
              <span className="tabular-nums">{active.rounds[round]?.stitches} {ar ? "غرزة" : "st"}</span>
            </div>
          )}
          {view === "assembly" && (
            <label className="absolute bottom-4 left-4 inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-sm bg-surface/85 px-4 text-sm backdrop-blur">
              <input type="checkbox" checked={explode} onChange={(e) => setExplode(e.target.checked)} className="h-4 w-4 accent-[rgb(var(--primary))]" />
              {ar ? "عرض مفصول" : "Exploded view"}
            </label>
          )}
        </div>

        {/* Transport */}
        {view === "part" && (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={toggle}
              aria-label={playing ? (ar ? "إيقاف" : "Pause") : ar ? "شغّلي البناء راوند راوند" : "Play the build round by round"}
              className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-sm bg-primary text-primary-fg transition-transform active:scale-95"
            >
              {playing ? <Icon d="M6 4h3v12H6zM11 4h3v12h-3z" /> : <Icon d="M6 4l10 6-10 6z" />}
            </button>
            <label className="flex min-w-[10rem] flex-1 items-center gap-3">
              <span className="sr-only">{ar ? "انتقلي لراوند" : "Scrub to round"}</span>
              <input
                type="range"
                min={1}
                max={total}
                value={round + 1}
                onChange={(e) => {
                  setPlaying(false);
                  setRound(Number(e.target.value) - 1);
                }}
                className="w-full accent-[rgb(var(--primary))]"
                aria-valuetext={`Round ${round + 1} of ${total}`}
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              {ar ? "السرعة" : "Speed"}
              <select
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value) as Speed)}
                className="min-h-10 cursor-pointer rounded-sm border border-line/15 bg-surface px-3 text-fg"
              >
                {SPEEDS.map((s) => (
                  <option key={s} value={s}>
                    {s}×
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-line/10 bg-surface/50 p-5 sm:p-6">
        <PatternList
          parts={pattern.parts}
          activePartId={view === "part" ? active.partId : ""}
          activeRound={round}
          terms={terms}
          assembly={pattern.assembly}
          onPick={pick}
          follow={playing}
          progress={progress}
        />
      </div>
    </div>
  );
}
