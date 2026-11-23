"use client";

import { useEffect, useRef } from "react";
import { assemblyAr, finishAr, instructionAr, partNameAr } from "@/lib/engine/arabic";
import type { AssemblyStep, PartPattern } from "@/lib/engine/types";
import { toTerms, type Terms } from "@/lib/engine/terms";
import { useT } from "@/lib/i18n/client";

export interface RoundProgress {
  done: Set<string>;
  toggle: (key: string) => void;
}

interface PatternListProps {
  parts: PartPattern[];
  activePartId: string;
  activeRound: number; // 0-based
  terms: Terms;
  assembly: AssemblyStep[];
  onPick: (partId: string, round: number) => void;
  follow: boolean;
  /** When given, every round gets a tick box and finished rounds are crossed off. */
  progress?: RoundProgress;
}

export const roundKey = (partId: string, n: number) => `${partId}:${n}`;

/** The written pattern. The current round is highlighted; clicking a row jumps the viewer there. */
export function PatternList({ parts, activePartId, activeRound, terms, assembly, onPick, follow, progress }: PatternListProps) {
  const activeRef = useRef<HTMLButtonElement>(null);
  const { t, locale } = useT();
  const ar = locale === "ar";
  const say = (text: string) => (ar ? instructionAr(text) : toTerms(text, terms));

  useEffect(() => {
    if (follow) activeRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeRound, activePartId, follow]);

  return (
    <div className="space-y-8">
      {parts.map((part) => (
        <section key={part.partId} aria-labelledby={`pl-${part.partId}`}>
          <div className="flex items-baseline justify-between gap-3">
            <h3 id={`pl-${part.partId}`} className="flex items-center gap-2 text-xl">
              <span className="h-3.5 w-3.5 rounded-full ring-1 ring-line/20" style={{ backgroundColor: part.colorHex }} aria-hidden="true" />
              {ar ? partNameAr(part.name) : part.name}
              {part.quantity > 1 && <span className="font-sans text-sm text-muted-foreground">× {part.quantity}</span>}
            </h3>
            <span className="text-xs text-muted-foreground">
              {part.kind === "rectangle" ? t.creator.rows : t.creator.rounds}: {part.rounds.length}
            </span>
          </div>
          <ol className="mt-3 space-y-0.5 text-[14px]">
            {part.rounds.map((r, i) => {
              const active = part.partId === activePartId && i === activeRound;
              const key = roundKey(part.partId, r.number);
              const done = progress?.done.has(key) ?? false;
              const label = part.kind === "rectangle" ? t.creator.markRowDone(r.number) : t.creator.markDone(r.number);
              return (
                <li key={r.number} className="flex items-start gap-2">
                  {progress && (
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={done}
                      aria-label={label}
                      title={label}
                      onClick={() => progress.toggle(key)}
                      className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition-colors ${done ? "border-peach bg-peach text-bg" : "border-line/30 hover:border-peach"}`}
                    >
                      {done && (
                        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M4 10.5l4 4 8-9" />
                        </svg>
                      )}
                    </button>
                  )}
                  <button
                    ref={active ? activeRef : undefined}
                    type="button"
                    onClick={() => onPick(part.partId, i)}
                    aria-current={active ? "step" : undefined}
                    className={`flex min-h-9 w-full cursor-pointer items-start justify-between gap-3 rounded-lg px-3 py-1.5 text-start transition-colors ${
                      active ? "bg-surface-2 text-fg ring-1 ring-peach/50" : "text-muted-foreground hover:bg-surface-2/60 hover:text-fg"
                    } ${done ? "line-through decoration-peach/70 opacity-60" : ""}`}
                  >
                    <span>
                      <span className="font-medium text-brand">
                        {part.kind === "rectangle" ? t.creator.row : t.creator.round} {r.number}
                      </span>
                      &ensp;<span dir={ar ? "rtl" : "ltr"}>{say(r.instruction)}</span>
                    </span>
                    <span className="shrink-0 tabular-nums">({r.stitches})</span>
                  </button>
                </li>
              );
            })}
          </ol>
          <p className="mt-2 px-3 text-sm italic text-muted-foreground">{ar ? finishAr(part.finish) : part.finish}</p>
        </section>
      ))}
      {assembly.length > 0 && (
        <section aria-labelledby="pl-assembly">
          <h3 id="pl-assembly" className="text-xl">
            {ar ? "التركيب" : "Assembly"}
          </h3>
          <ol className="mt-3 list-decimal space-y-2 ps-8 text-sm leading-relaxed text-muted-foreground">
            {assembly.map((s) => (
              <li key={s.partId}>{ar ? assemblyAr(s.text) : s.text}</li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
