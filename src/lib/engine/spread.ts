import type { RunGroup } from "./types";

/**
 * Builds the run-length groups that take a round of `prev` stitches to `next` stitches,
 * spreading increases or decreases as evenly as possible (group sizes differ by at most 1).
 */
export function transitionRuns(prev: number, next: number): RunGroup[] {
  if (!Number.isInteger(prev) || !Number.isInteger(next) || prev <= 0 || next <= 0) {
    throw new Error(`Invalid transition ${prev} -> ${next}`);
  }
  if (next === prev) {
    return [{ repeat: 1, seq: [{ op: "sc", count: prev }] }];
  }
  if (next > prev) {
    const d = next - prev;
    if (d > prev) {
      throw new Error(`Too many increases: ${prev} -> ${next}`);
    }
    return evenGroups(prev - d, d, "inc");
  }
  const d = prev - next;
  if (d > Math.floor(prev / 2)) {
    throw new Error(`Too many decreases: ${prev} -> ${next}`);
  }
  return evenGroups(prev - 2 * d, d, "dec");
}

function evenGroups(plain: number, d: number, op: "inc" | "dec"): RunGroup[] {
  const q = Math.floor(plain / d);
  const r = plain % d;
  const groups: RunGroup[] = [];
  if (r > 0) {
    groups.push({ repeat: r, seq: [{ op: "sc", count: q + 1 }, { op, count: 1 }] });
  }
  if (d - r > 0) {
    groups.push({
      repeat: d - r,
      seq: q > 0 ? [{ op: "sc", count: q }, { op, count: 1 }] : [{ op, count: 1 }],
    });
  }
  return groups;
}

/** Writes run groups for a round of single crochet in US terms. */
export function runsToText(prev: number, runs: RunGroup[]): string {
  // Whole-round shortcuts.
  if (runs.length === 1 && runs[0].repeat === 1 && runs[0].seq.length === 1) {
    const only = runs[0].seq[0];
    if (only.op === "sc" && only.count === prev) return "sc in each st";
  }
  if (
    runs.length === 1 &&
    runs[0].seq.length === 1 &&
    runs[0].seq[0].op === "inc" &&
    runs[0].repeat === prev
  ) {
    return "inc in each st";
  }
  return runs
    .map((g) => {
      if (g.seq.length === 1) {
        const it = g.seq[0];
        if (it.op === "sc") return `${it.count} sc`;
        return `${it.op} x${g.repeat * it.count}`;
      }
      const inner = g.seq.map((it) => (it.op === "sc" ? `${it.count} sc` : it.op)).join(", ");
      return g.repeat === 1 ? inner : `(${inner}) x${g.repeat}`;
    })
    .join(", ");
}

/** Stitches consumed and produced by a list of run groups. */
export function simulateRuns(runs: RunGroup[]): { consumed: number; produced: number } {
  let consumed = 0;
  let produced = 0;
  for (const g of runs) {
    for (const it of g.seq) {
      const n = it.count * g.repeat;
      switch (it.op) {
        case "sc":
        case "dc":
          consumed += n;
          produced += n;
          break;
        case "inc":
          consumed += n;
          produced += 2 * n;
          break;
        case "dec":
          consumed += 2 * n;
          produced += n;
          break;
        case "mr":
          produced += n;
          break;
        case "ch":
        case "turn":
        case "join":
          break;
      }
    }
  }
  return { consumed, produced };
}
