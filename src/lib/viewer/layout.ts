import type { EnginePart, PartPattern, Pattern } from "@/lib/engine/types";

export type V3 = [number, number, number];

/** One stitch instance: position, rotation around Y, and its size. All in cm. */
export interface StitchInstance {
  round: number; // 0-based round index
  pos: V3;
  angle: number;
  /** Lean of the stitch so it lies on the surface (radians, around the ring tangent). */
  tilt: number;
  width: number;
  height: number;
}

/** Hard cap so very large pieces stay smooth. */
export const MAX_INSTANCES = 9000;

/**
 * Places every stitch of a part of revolution on its ring. Rounds spiral slightly
 * (half a stitch per round), as amigurumi worked in a continuous spiral does.
 * When the total is above MAX_INSTANCES, each ring is thinned evenly.
 */
export function stitchInstances(part: PartPattern, rowHeightCm: number): StitchInstance[] {
  const total = part.rounds.reduce((a, r) => a + r.stitches, 0);
  const thin = Math.max(1, Math.ceil(total / MAX_INSTANCES));
  const out: StitchInstance[] = [];
  const rs = part.rounds;
  part.rounds.forEach((round, ri) => {
    const n = round.stitches;
    const a = rs[Math.max(0, ri - 1)];
    const b = rs[Math.min(rs.length - 1, ri + 1)];
    const tilt = -Math.atan2(b.radiusCm - a.radiusCm, Math.max(1e-4, b.yCm - a.yCm));
    const circumference = 2 * Math.PI * Math.max(round.radiusCm, 0.05);
    const width = (circumference / n) * 0.9 * thin;
    for (let j = 0; j < n; j += thin) {
      const angle = ((j + ri * 0.5) / n) * Math.PI * 2;
      out.push({
        round: ri,
        pos: [Math.cos(angle) * round.radiusCm, round.yCm, Math.sin(angle) * round.radiusCm],
        angle,
        tilt,
        width: Math.max(width, 0.08),
        height: rowHeightCm * 0.95,
      });
    }
  });
  return out;
}

/** Height and widest radius of a built part of revolution, in cm. */
export function partExtent(part: PartPattern): { height: number; radius: number } {
  let height = 0;
  let radius = 0;
  for (const r of part.rounds) {
    height = Math.max(height, r.yCm);
    radius = Math.max(radius, r.radiusCm);
  }
  return { height, radius };
}

export interface PartPlacement {
  partId: string;
  copy: number;
  /** Where the part's own origin (its round 1) goes, in cm. */
  origin: V3;
  /** Unit vector the part's +Y axis points along. */
  up: V3;
}

function norm(v: V3): V3 {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
}

/**
 * Places every part for the assembly view. Root parts stand upright at the origin.
 * A child sits on its parent at its `position` (-1..1 on each axis of the parent);
 * open pieces (ears, cones) point their open edge at the parent. `explode` pushes
 * children outward along their attach direction.
 */
export function assemblyLayout(pattern: Pattern, parts: EnginePart[], explode: number): PartPlacement[] {
  const built = new Map(pattern.parts.map((p) => [p.partId, p]));
  const spec = new Map(parts.map((p) => [p.id, p]));
  const centers = new Map<string, V3>();
  const out: PartPlacement[] = [];

  const placeRoot = (p: EnginePart, x: number) => {
    const b = built.get(p.id);
    if (!b) return;
    const ext = partExtent(b);
    const origin: V3 = [x, -ext.height / 2, 0];
    centers.set(p.id, [x, 0, 0]);
    out.push({ partId: p.id, copy: 0, origin, up: [0, 1, 0] });
  };

  // Order parents before children.
  const ordered: EnginePart[] = [];
  const seen = new Set<string>();
  const visit = (p: EnginePart, depth: number) => {
    if (seen.has(p.id) || depth > parts.length) return;
    const parent = p.attachTo ? spec.get(p.attachTo) : undefined;
    if (parent) visit(parent, depth + 1);
    seen.add(p.id);
    ordered.push(p);
  };
  parts.forEach((p) => visit(p, 0));

  let rootX = 0;
  for (const p of ordered) {
    const b = built.get(p.id);
    if (!b) continue;
    const parent = p.attachTo ? spec.get(p.attachTo) : undefined;
    const parentBuilt = parent ? built.get(parent.id) : undefined;
    const parentCenter = parent ? centers.get(parent.id) : undefined;
    if (!parent || !parentBuilt || !parentCenter || b.kind !== "revolution" || parentBuilt.kind !== "revolution") {
      placeRoot(p, rootX);
      rootX += partExtent(b).radius * 2.6 + 2;
      continue;
    }
    const pe = partExtent(parentBuilt);
    const ce = partExtent(b);
    for (let copy = 0; copy < p.quantity; copy++) {
      // Copies are mirrored left/right.
      const sx = copy % 2 === 0 ? 1 : -1;
      const rel: V3 = [p.position.x * sx * pe.radius, p.position.y * (pe.height / 2), p.position.z * pe.radius];
      const dir = norm(rel[0] === 0 && rel[1] === 0 && rel[2] === 0 ? [0, 1, 0] : rel);
      const attach: V3 = [parentCenter[0] + rel[0], parentCenter[1] + rel[1], parentCenter[2] + rel[2]];
      const push = explode * Math.max(ce.radius, 1);
      let origin: V3;
      let up: V3;
      if (b.closed) {
        // Closed part: its center sits just outside the attach point, its axis along the direction.
        const c = ce.radius * 0.58 + push;
        up = dir;
        origin = [
          attach[0] + dir[0] * c - up[0] * (ce.height / 2),
          attach[1] + dir[1] * c - up[1] * (ce.height / 2),
          attach[2] + dir[2] * c - up[2] * (ce.height / 2),
        ];
        if (copy === 0) centers.set(p.id, [attach[0] + dir[0] * c, attach[1] + dir[1] * c, attach[2] + dir[2] * c]);
      } else {
        // Open part: tip outward, open edge on the parent.
        up = [-dir[0], -dir[1], -dir[2]];
        const tip = ce.height + push;
        origin = [attach[0] + dir[0] * tip, attach[1] + dir[1] * tip, attach[2] + dir[2] * tip];
        if (copy === 0) centers.set(p.id, origin);
      }
      out.push({ partId: p.id, copy, origin, up });
    }
  }
  return out;
}
