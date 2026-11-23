import { runsToText, transitionRuns } from "./spread";
import type { EnginePart, Gauge, PartPattern, Round, RunGroup } from "./types";

const START = 6;
/** Natural maximum change per round for single crochet worked in the round. */
const STEP = 6;

/** Rounds a stitch count to a multiple of 6, never below 6. */
export function snap6(n: number): number {
  return Math.max(START, Math.round(n / 6) * 6);
}

/** Largest count reachable from `prev` in one round (at most one increase per stitch). */
function maxNext(prev: number): number {
  return prev * 2;
}

/** Smallest count reachable from `prev` in one round (at most floor(prev/2) decreases). */
function minNext(prev: number): number {
  return prev - Math.floor(prev / 2);
}

/** Clamps a target count so the transition from `prev` is legal. */
export function clampNext(prev: number, target: number, snapToSix: boolean): number {
  let t = Math.max(START, Math.round(target));
  if (snapToSix) t = snap6(t);
  const hi = maxNext(prev);
  const lo = minNext(prev);
  if (t > hi) t = snapToSix ? Math.floor(hi / 6) * 6 : hi;
  if (t < lo) t = snapToSix ? Math.ceil(lo / 6) * 6 : lo;
  return Math.max(START, t);
}

/** Radius as a fraction of the maximum radius, at position t (0..1) along the part. */
export function profileRadius(shape: EnginePart["shape"], t: number): number {
  const c = Math.min(1, Math.max(0, t));
  switch (shape) {
    case "sphere":
    case "ellipsoid":
      return Math.sqrt(Math.max(0, 1 - (2 * c - 1) ** 2));
    case "cone":
      return Math.max(0.05, c);
    case "ear":
      // Widens from the tip, peaks around 70 percent, eases slightly toward the open edge.
      return Math.max(0.1, Math.sin(Math.min(Math.PI * 0.5, (c / 0.7) * Math.PI * 0.5)) * (c > 0.7 ? 1 - (c - 0.7) * 0.4 : 1));
    case "cylinder":
    case "capsule":
      return 1;
    default:
      return 1;
  }
}

export function isClosedShape(shape: EnginePart["shape"]): boolean {
  return shape === "sphere" || shape === "ellipsoid" || shape === "cylinder" || shape === "capsule";
}

function mrRuns(): RunGroup[] {
  return [{ repeat: 1, seq: [{ op: "mr", count: START }] }];
}

/**
 * Builds the list of stitch counts for a part of revolution.
 * Spheres and capsules use the classic +6/-6 amigurumi shaping with plain rounds in the middle;
 * cylinders use a flat base disk, straight wall and flat top; other shapes follow their profile.
 */
export function revolutionCounts(part: EnginePart, gauge: Gauge): number[] {
  const radiusCm = Math.max(part.widthCm, part.depthCm) / 2;
  const totalRounds = Math.max(1, Math.round(part.heightCm / gauge.rowHeightCm));
  const circumference = (2 * Math.PI * radiusCm) / gauge.stitchWidthCm;
  const snap =
    part.snapToSix ??
    (part.shape === "sphere" || part.shape === "capsule" || part.shape === "cylinder" || part.shape === "ellipsoid");

  if (part.shape === "sphere" || part.shape === "capsule") {
    let max = snap ? snap6(circumference) : Math.max(START, Math.round(circumference / 6) * 6);
    let k = max / 6;
    // Shaping takes 2k - 1 rounds; shrink the widest round if the part is too short for it.
    const maxK = Math.max(1, Math.floor((totalRounds + 1) / 2));
    if (k > maxK) {
      k = maxK;
      max = k * 6;
    }
    const counts: number[] = [];
    for (let i = 1; i <= k; i++) counts.push(i * 6);
    const plain = Math.max(0, totalRounds - (2 * k - 1));
    for (let i = 0; i < plain; i++) counts.push(max);
    for (let i = k - 1; i >= 1; i--) counts.push(i * 6);
    return counts;
  }

  if (part.shape === "cylinder") {
    const max = snap6(circumference);
    const k = max / 6;
    const counts: number[] = [];
    for (let i = 1; i <= k; i++) counts.push(i * 6);
    const wall = Math.max(1, totalRounds);
    for (let i = 0; i < wall; i++) counts.push(max);
    for (let i = k - 1; i >= 1; i--) counts.push(i * 6);
    return counts;
  }

  // Profile-driven shapes: ellipsoid, cone, ear.
  // Fabric lies naturally with at most 6 increases or decreases per round, so the target is
  // also capped by the rounds since the start and, for closed shapes, by the rounds left to close.
  const closed = isClosedShape(part.shape);
  const counts: number[] = [START];
  for (let i = 2; i <= totalRounds; i++) {
    const t = (i - 0.5) / totalRounds;
    let target = Math.min(circumference * profileRadius(part.shape, t), STEP * i);
    if (closed) target = Math.min(target, STEP * (totalRounds - i + 1));
    const prev = counts[counts.length - 1];
    target = Math.min(prev + STEP, Math.max(prev - STEP, target));
    counts.push(clampNext(prev, target, snap));
  }
  if (closed) {
    while (counts[counts.length - 1] > START) {
      const prev = counts[counts.length - 1];
      counts.push(clampNext(prev, prev - STEP, snap));
    }
  }
  return counts;
}

export function buildRevolutionPart(part: EnginePart, gauge: Gauge): PartPattern {
  const counts = revolutionCounts(part, gauge);
  const rounds: Round[] = [];
  let y = 0;
  let prevRadius = 0;
  counts.forEach((count, idx) => {
    const radiusCm = (count * gauge.stitchWidthCm) / (2 * Math.PI);
    // Each round advances one row height along the surface; the part of it that goes
    // outward (a change in radius) does not add height, so flat disks stay flat.
    const dr = Math.abs(radiusCm - prevRadius);
    if (idx > 0) y += Math.sqrt(Math.max(0, gauge.rowHeightCm ** 2 - dr ** 2));
    prevRadius = radiusCm;
    if (idx === 0) {
      rounds.push({
        number: 1,
        stitches: count,
        instruction: `${START} sc in magic ring`,
        runs: mrRuns(),
        radiusCm,
        yCm: y,
      });
      return;
    }
    const prev = counts[idx - 1];
    const runs = transitionRuns(prev, count);
    rounds.push({
      number: idx + 1,
      stitches: count,
      instruction: runsToText(prev, runs),
      runs,
      radiusCm,
      yCm: y,
    });
  });

  const closed = isClosedShape(part.shape);
  const finish = closed
    ? "Fasten off, stuff, and close."
    : part.shape === "ear"
      ? "Fasten off, leaving a long tail. Flatten; do not stuff."
      : "Fasten off, leaving a long tail for sewing.";

  return {
    partId: part.id,
    name: part.name,
    shape: part.shape,
    kind: "revolution",
    colorHex: part.colorHex,
    quantity: part.quantity,
    closed,
    rounds,
    finish,
    totalStitches: counts.reduce((a, b) => a + b, 0),
  };
}
