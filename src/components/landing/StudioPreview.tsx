"use client";

import { motion } from "framer-motion";
import { CountUp } from "./CountUp";

const ROUNDS = [1, 2, 3, 4, 5] as const;
const CENTER = 100;
const RING_STEP = 15;

// Round n of a flat disc has 6n stitches, exactly like the first rounds of a magic ring.
function ringDots(round: number) {
  const count = round * 6;
  const radius = round * RING_STEP;
  return Array.from({ length: count }, (_, index) => {
    const angle = (index / count) * Math.PI * 2 - Math.PI / 2;
    return {
      x: Number((CENTER + radius * Math.cos(angle)).toFixed(2)),
      y: Number((CENTER + radius * Math.sin(angle)).toFixed(2)),
    };
  });
}

// What you see behind the Studio door: stitches appearing ring by ring.
export function StudioPreview({ open }: { open: boolean }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 pt-12">
      <svg viewBox="0 0 200 200" className="h-48 w-48 sm:h-56 sm:w-56">
        {ROUNDS.map((round) => (
          <motion.g
            key={round}
            initial={false}
            animate={{ opacity: open ? 1 : 0, scale: open ? 1 : 0.7 }}
            transition={{ duration: 0.45, delay: open ? 0.3 + round * 0.16 : 0 }}
            style={{ originX: 0.5, originY: 0.5 }}
          >
            {ringDots(round).map((dot, index) => (
              <circle
                key={index}
                cx={dot.x}
                cy={dot.y}
                r={4.2}
                className={round === 5 ? "fill-berry" : "fill-cocoa/60"}
              />
            ))}
          </motion.g>
        ))}
      </svg>
      <p className="font-serif text-lg">
        Round 5 · <CountUp to={30} active={open} className="tabular-nums" /> stitches
      </p>
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-cocoa/70">
        Every count calculated, never guessed
      </p>
    </div>
  );
}
