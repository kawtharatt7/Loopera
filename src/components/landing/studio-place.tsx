"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ArrowIcon, ButtonLink } from "@/components/ui/button";
import { DAILY_FREE_DESIGNS } from "@/lib/credits/constants";
import { CountUp } from "./CountUp";

const ROUNDS = [1, 2, 3, 4, 5] as const;
const CENTER = 100;
const STEP = 15;

function ringDots(round: number) {
  const count = round * 6;
  return Array.from({ length: count }, (_, i) => {
    const a = (i / count) * Math.PI * 2 - Math.PI / 2;
    return { x: +(CENTER + round * STEP * Math.cos(a)).toFixed(2), y: +(CENTER + round * STEP * Math.sin(a)).toFixed(2) };
  });
}

const LINES = [
  { r: 1, text: "6 sc in magic ring", n: 6 },
  { r: 2, text: "inc in each st", n: 12 },
  { r: 3, text: "(1 sc, inc) x6", n: 18 },
  { r: 4, text: "(2 sc, inc) x6", n: 24 },
  { r: 5, text: "(3 sc, inc) x6", n: 30 },
];

const FEATURES = [
  "Upload a photo or sketch, or describe the piece in Arabic or English",
  "Every stitch count is calculated by code and checked round by round",
  "Watch it build in 3D, then export a clean PDF pattern",
];

export function StudioPlace() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });

  return (
    <section id="studio-place" aria-labelledby="studio-place-heading" className="bg-grid relative scroll-mt-20 border-y border-line/10 bg-surface/40 py-24 sm:py-32">
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-brand">Studio · I crochet</p>
          <h2 id="studio-place-heading" className="mt-3 text-balance text-4xl leading-tight sm:text-5xl">
            A calm workbench where the math is done for you.
          </h2>
          <ul className="mt-8 space-y-4">
            {FEATURES.map((f) => (
              <li key={f} className="flex gap-3 text-muted-foreground">
                <svg viewBox="0 0 20 20" className="mt-0.5 h-5 w-5 shrink-0 text-peach" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M4 10.5l4 4 8-9" />
                </svg>
                <span className="leading-relaxed">{f}</span>
              </li>
            ))}
          </ul>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <ButtonLink href="/studio" size="lg">
              Open the Studio <ArrowIcon />
            </ButtonLink>
            <span className="rounded-full border border-line/15 px-4 py-2 text-sm text-muted-foreground">
              {DAILY_FREE_DESIGNS} free designs every day
            </span>
          </div>
        </div>

        <div ref={ref} className="glow-soft rounded-5xl border border-line/10 bg-bg/80 p-6 sm:p-8">
          <div className="grid items-center gap-6 sm:grid-cols-[auto_1fr]">
            <svg viewBox="0 0 200 200" className="mx-auto h-44 w-44" role="img" aria-label="A flat circle growing from 6 to 30 stitches over five rounds">
              {ROUNDS.map((round) => (
                <motion.g
                  key={round}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={inView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ duration: 0.45, delay: 0.2 + round * 0.22 }}
                  style={{ originX: 0.5, originY: 0.5 }}
                >
                  {ringDots(round).map((d, i) => (
                    <circle key={i} cx={d.x} cy={d.y} r={4} className={round === 5 ? "fill-peach" : "fill-rose/55"} />
                  ))}
                </motion.g>
              ))}
            </svg>
            <ol className="space-y-1.5 font-mono text-[13px]" aria-label="Pattern">
              {LINES.map((l, i) => (
                <motion.li
                  key={l.r}
                  initial={{ opacity: 0, x: 8 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.35, delay: 0.25 + i * 0.22 }}
                  className={`flex justify-between gap-3 rounded-xl px-3 py-1.5 ${i === 4 ? "bg-surface-2 text-fg" : "text-muted-foreground"}`}
                >
                  <span className="whitespace-nowrap">
                    R{l.r} · {l.text}
                  </span>
                  <span className="tabular-nums">({l.n})</span>
                </motion.li>
              ))}
            </ol>
          </div>
          <p className="mt-6 border-t border-line/10 pt-5 text-center font-serif text-lg">
            Round 5 · <CountUp to={30} active={inView} className="tabular-nums text-peach" /> stitches, every one checked
          </p>
        </div>
      </div>
    </section>
  );
}
