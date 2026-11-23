import { simulateRuns } from "./spread";
import type { PartPattern, RunGroup } from "./types";

export class PatternValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PatternValidationError";
  }
}

/**
 * Parses a single-crochet round instruction (US terms) back into run groups.
 * Supported forms: "6 sc in magic ring", "sc in each st", "inc in each st",
 * "(3 sc, inc) x6", "inc x6", "dec x6", "4 sc", joined by ", " at the top level.
 */
export function parseInstruction(text: string, prev: number): RunGroup[] {
  const t = text.trim();
  const mr = /^(\d+) sc in magic ring$/.exec(t);
  if (mr) return [{ repeat: 1, seq: [{ op: "mr", count: Number(mr[1]) }] }];
  if (t === "sc in each st") return [{ repeat: 1, seq: [{ op: "sc", count: prev }] }];
  if (t === "inc in each st") return [{ repeat: prev, seq: [{ op: "inc", count: 1 }] }];

  const groups: RunGroup[] = [];
  for (const token of splitTopLevel(t)) {
    const grouped = /^\((.+)\) x(\d+)$/.exec(token);
    if (grouped) {
      const seq = grouped[1].split(",").map((s) => parseAtom(s.trim()));
      groups.push({ repeat: Number(grouped[2]), seq });
      continue;
    }
    const repeated = /^(inc|dec) x(\d+)$/.exec(token);
    if (repeated) {
      groups.push({ repeat: Number(repeated[2]), seq: [{ op: repeated[1] as "inc" | "dec", count: 1 }] });
      continue;
    }
    groups.push({ repeat: 1, seq: [parseAtom(token)] });
  }
  return groups;
}

function parseAtom(s: string): { op: "sc" | "inc" | "dec"; count: number } {
  const sc = /^(\d+) sc$/.exec(s);
  if (sc) return { op: "sc", count: Number(sc[1]) };
  if (s === "inc" || s === "dec") return { op: s, count: 1 };
  throw new PatternValidationError(`Cannot parse instruction "${s}"`);
}

function splitTopLevel(s: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = "";
  for (const ch of s) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      out.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

function countOp(runs: RunGroup[], op: string): number {
  return runs.reduce((acc, g) => acc + g.seq.filter((s) => s.op === op).reduce((a, s) => a + s.count, 0) * g.repeat, 0);
}

/**
 * Simulates every round of a part. Throws when the stitches consumed do not equal the
 * previous round's count, or the stitches produced do not equal this round's count.
 */
export function validatePart(part: PartPattern): void {
  if (part.rounds.length === 0) throw new PatternValidationError(`${part.name}: no rounds`);
  part.rounds.forEach((round, i) => {
    const where = `${part.name}, round ${round.number}`;
    if (!Number.isInteger(round.stitches) || round.stitches <= 0) {
      throw new PatternValidationError(`${where}: invalid stitch count ${round.stitches}`);
    }

    if (part.kind === "revolution") {
      const prev = i === 0 ? 0 : part.rounds[i - 1].stitches;
      // Simulate both the structured form and the written text; they must agree.
      for (const runs of [round.runs, parseInstruction(round.instruction, prev)]) {
        const { consumed, produced } = simulateRuns(runs);
        if (consumed !== prev) {
          throw new PatternValidationError(`${where}: consumes ${consumed}, previous round has ${prev}`);
        }
        if (produced !== round.stitches) {
          throw new PatternValidationError(`${where}: produces ${produced}, expected ${round.stitches}`);
        }
      }
      if (round.stitches > 2 * prev && i > 0) {
        throw new PatternValidationError(`${where}: more increases than stitches`);
      }
      return;
    }

    if (part.kind === "rectangle") {
      const prev = i === 0 ? round.stitches : part.rounds[i - 1].stitches;
      const { consumed, produced } = simulateRuns(round.runs);
      if (consumed !== prev || produced !== round.stitches) {
        throw new PatternValidationError(`${where}: row does not match (${consumed} -> ${produced})`);
      }
      return;
    }

    // Granny square: 12r dc in round r, in 4r clusters of 3.
    const r = round.number;
    const dc = countOp(round.runs, "dc") + (r === 1 ? 1 : 0); // round 1: ch 3 counts as a dc
    if (dc !== 12 * r || round.stitches !== 12 * r) {
      throw new PatternValidationError(`${where}: has ${dc} dc, expected ${12 * r}`);
    }
  });

  if (part.kind === "revolution" && part.closed) {
    const last = part.rounds[part.rounds.length - 1].stitches;
    if (last !== 6) throw new PatternValidationError(`${part.name}: closed part ends with ${last}, not 6`);
  }
}
