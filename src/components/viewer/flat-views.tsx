"use client";

import { motion } from "framer-motion";
import type { PartPattern } from "@/lib/engine/types";

interface ViewProps {
  part: PartPattern;
  round: number; // 0-based, rounds up to this one are shown
  onPick?: (round: number) => void;
}

/** Row-by-row side profile of a part of revolution: each round is a bar as wide as its stitch count. */
export function ProfileView({ part, round, onPick }: ViewProps) {
  const max = Math.max(...part.rounds.map((r) => r.stitches));
  const rows = part.rounds.length;
  const rowH = Math.min(18, 300 / rows);
  const height = rows * rowH + 20;
  return (
    <svg viewBox={`0 0 320 ${height}`} className="h-full w-full" role="img" aria-label={`${part.name}, side view, round ${round + 1} of ${rows}`}>
      {part.rounds.map((r, i) => {
        const w = (r.stitches / max) * 280;
        const y = height - 10 - (i + 1) * rowH;
        const visible = i <= round;
        return (
          <motion.rect
            key={r.number}
            x={160 - w / 2}
            y={y}
            width={w}
            height={rowH - 2}
            rx={(rowH - 2) / 2}
            initial={false}
            animate={{ opacity: visible ? 1 : 0.08 }}
            transition={{ duration: 0.25 }}
            fill={part.colorHex}
            className={i === round ? "stroke-peach" : ""}
            strokeWidth={i === round ? 2 : 0}
            onClick={() => onPick?.(i)}
            style={{ cursor: onPick ? "pointer" : undefined }}
          />
        );
      })}
    </svg>
  );
}

/** Rectangle chart: one strip per row. */
function RectangleChart({ part, round, onPick }: ViewProps) {
  const rows = part.rounds.length;
  const rowH = Math.min(16, 280 / rows);
  const h = rows * rowH + 20;
  return (
    <svg viewBox={`0 0 320 ${h}`} className="h-full w-full" role="img" aria-label={`${part.name}, row ${round + 1} of ${rows}`}>
      {part.rounds.map((r, i) => (
        <motion.rect
          key={r.number}
          x={20}
          y={h - 10 - (i + 1) * rowH}
          width={280}
          height={rowH - 2}
          rx={3}
          fill={part.colorHex}
          initial={false}
          animate={{ opacity: i <= round ? 1 : 0.08 }}
          className={i === round ? "stroke-peach" : ""}
          strokeWidth={i === round ? 2 : 0}
          onClick={() => onPick?.(i)}
          style={{ cursor: onPick ? "pointer" : undefined }}
        />
      ))}
    </svg>
  );
}

/** Granny square chart: each round is a ring of 3-dc clusters, 4r clusters in round r. */
function GrannyChart({ part, round, onPick }: ViewProps) {
  const rounds = part.rounds.length;
  const step = 140 / rounds;
  return (
    <svg viewBox="0 0 320 320" className="h-full w-full" role="img" aria-label={`${part.name}, round ${round + 1} of ${rounds}`}>
      {part.rounds.map((r, i) => {
        const half = (i + 1) * step;
        const clusters = 4 * (i + 1);
        const perSide = clusters / 4;
        const marks: { x: number; y: number; rot: number }[] = [];
        for (let side = 0; side < 4; side++) {
          for (let k = 0; k < perSide; k++) {
            const t = (k + 0.5) / perSide;
            const along = -half + t * 2 * half;
            const pos =
              side === 0
                ? { x: along, y: -half, rot: 0 }
                : side === 1
                  ? { x: half, y: along, rot: 90 }
                  : side === 2
                    ? { x: -along, y: half, rot: 180 }
                    : { x: -half, y: -along, rot: 270 };
            marks.push(pos);
          }
        }
        return (
          <motion.g
            key={r.number}
            initial={false}
            animate={{ opacity: i <= round ? 1 : 0.07 }}
            transition={{ duration: 0.3 }}
            onClick={() => onPick?.(i)}
            style={{ cursor: onPick ? "pointer" : undefined }}
          >
            {marks.map((m, j) => (
              <g key={j} transform={`translate(${160 + m.x} ${160 + m.y}) rotate(${m.rot})`}>
                {[-4, 0, 4].map((dx) => (
                  <rect key={dx} x={dx - 1.2} y={-step * 0.38} width={2.4} height={step * 0.76} rx={1.2} fill={part.colorHex} />
                ))}
              </g>
            ))}
            {i === round && (
              <rect x={160 - half - 6} y={160 - half - 6} width={2 * half + 12} height={2 * half + 12} rx={8} fill="none" className="stroke-peach" strokeWidth={1.5} strokeDasharray="4 4" />
            )}
          </motion.g>
        );
      })}
    </svg>
  );
}

export function FlatChart(props: ViewProps) {
  return props.part.kind === "granny_square" ? <GrannyChart {...props} /> : <RectangleChart {...props} />;
}
