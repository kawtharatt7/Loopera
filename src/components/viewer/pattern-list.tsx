"use client";

import { useEffect, useRef } from "react";
import type { AssemblyStep, PartPattern } from "@/lib/engine/types";
import { toTerms, type Terms } from "@/lib/engine/terms";

interface PatternListProps {
  parts: PartPattern[];
  activePartId: string;
  activeRound: number; // 0-based
  terms: Terms;
  assembly: AssemblyStep[];
  onPick: (partId: string, round: number) => void;
  follow: boolean;
}

/** The written pattern. The current round is highlighted; clicking a row jumps the viewer there. */
export function PatternList({ parts, activePartId, activeRound, terms, assembly, onPick, follow }: PatternListProps) {
  const activeRef = useRef<HTMLButtonElement>(null);

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
              {part.name}
              {part.quantity > 1 && <span className="font-sans text-sm text-muted-foreground">× {part.quantity}</span>}
            </h3>
            <span className="text-xs text-muted-foreground">
              {part.rounds.length} {part.kind === "rectangle" ? "rows" : "rounds"}
            </span>
          </div>
          <ol className="mt-3 space-y-0.5 font-mono text-[13px]">
            {part.rounds.map((r, i) => {
              const active = part.partId === activePartId && i === activeRound;
              return (
                <li key={r.number}>
                  <button
                    ref={active ? activeRef : undefined}
                    type="button"
                    onClick={() => onPick(part.partId, i)}
                    aria-current={active ? "step" : undefined}
                    className={`flex w-full cursor-pointer items-start justify-between gap-3 rounded-xl px-3 py-1.5 text-left transition-colors ${
                      active ? "bg-surface-2 text-fg ring-1 ring-peach/50" : "text-muted-foreground hover:bg-surface-2/60 hover:text-fg"
                    }`}
                  >
                    <span>
                      <span className="text-brand">{part.kind === "rectangle" ? "Row" : "R"}{r.number}</span> · {toTerms(r.instruction, terms)}
                    </span>
                    <span className="shrink-0 tabular-nums">({r.stitches})</span>
                  </button>
                </li>
              );
            })}
          </ol>
          <p className="mt-2 px-3 text-sm italic text-muted-foreground">{part.finish}</p>
        </section>
      ))}
      {assembly.length > 0 && (
        <section aria-labelledby="pl-assembly">
          <h3 id="pl-assembly" className="text-xl">
            Assembly
          </h3>
          <ol className="mt-3 list-decimal space-y-2 pl-8 text-sm leading-relaxed text-muted-foreground">
            {assembly.map((s) => (
              <li key={s.partId}>{s.text}</li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
