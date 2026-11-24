// Builds the finished piece for the "forming" 3D view: every stitch of every part, placed where it
// ends up once the piece is assembled, with the moment it appears while the piece forms.
// Bodies worked in the round keep their real rounds (squashed to the piece's depth), handles and
// straps become arches over the body, flat panels become the two faces of a bag or a garment.
// Pure: no three.js, so it is tested like the engine.
import type { EnginePart, PartPattern, Pattern } from "@/lib/engine/types";
import { assemblyLayout, type V3 } from "./layout";

export type Make = "toy" | "bag" | "clothes" | "flat" | "other";

export interface PieceStitch {
  p: V3;
  /** Surface normal and the direction along the row: they orient the stitch. */
  n: V3;
  t: V3;
  w: number;
  h: number;
  color: string;
  /** When it appears, 0..1 across the whole build. */
  at: number;
}

/** The smooth fabric behind the stitches: a lathe for parts in the round, a sheet for flat ones. */
export interface PieceBody {
  /** Lathe profile (parts worked in the round); empty for sheets. */
  profile: [r: number, y: number][];
  /** Sheet grid, nu × nv points row by row (flat panels and straps); empty for lathes. */
  grid: V3[];
  nu: number;
  nv: number;
  zs: number;
  origin: V3;
  up: V3;
  color: string;
  open: boolean;
  /** Build time when this part is finished (the body fades in by then). */
  from: number;
  to: number;
}

export interface Piece {
  /** Safety eyes on a toy's head (finishing, added at the end). */
  eyes: { p: V3; r: number }[];
  stitches: PieceStitch[];
  bodies: PieceBody[];
  center: V3;
  size: number;
}

export const PIECE_MAX_STITCHES = 14000;

const STRAP_WORDS = /strap|handle|حزام|يد|علاق|حمال|سير/i;
const SLEEVE = /sleeve|كم/i;
const BACK = /back|خلف/i;
const FRONT = /front|امام|أمام/i;

type Draft = Omit<PieceStitch, "at"> & { order: number };

const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const scale = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
const norm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

/** Rotates v from the +Y frame into a frame whose +Y is `up`. */
function fromUp(up: V3, v: V3): V3 {
  const u = norm(up);
  if (Math.abs(u[1] - 1) < 1e-6) return v;
  if (Math.abs(u[1] + 1) < 1e-6) return [v[0], -v[1], -v[2]];
  const axis = norm(cross([0, 1, 0], u));
  const ang = Math.acos(Math.max(-1, Math.min(1, u[1])));
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  const d = axis[0] * v[0] + axis[1] * v[1] + axis[2] * v[2];
  const x = cross(axis, v);
  return [v[0] * c + x[0] * s + axis[0] * d * (1 - c), v[1] * c + x[1] * s + axis[1] * d * (1 - c), v[2] * c + x[2] * s + axis[2] * d * (1 - c)];
}

/** Rotates v by angle around the Z axis. */
const rotZ = (v: V3, a: number): V3 => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a), v[2]];

export function isStrap(spec: EnginePart, make: Make): boolean {
  if (spec.shape !== "rectangle" && spec.shape !== "capsule" && spec.shape !== "cylinder") return false;
  const long = spec.heightCm / Math.max(0.1, spec.widthCm) >= 3.5;
  if (STRAP_WORDS.test(spec.name) || STRAP_WORDS.test(spec.id)) return true;
  return long && (spec.attachTo !== null || make === "bag" || make === "clothes");
}

/** Ring stitches of a part worked in the round, in its own frame (+Y up), depth squashed by zs. */
function ringStitches(part: PartPattern, zs: number, rowH: number, thin: number): { p: V3; n: V3; t: V3; w: number; h: number; row: number }[] {
  const rs = part.rounds;
  const mid = (rs[0].yCm + rs[rs.length - 1].yCm) / 2;
  const out: { p: V3; n: V3; t: V3; w: number; h: number; row: number }[] = [];
  rs.forEach((round, ri) => {
    const a = rs[Math.max(0, ri - 1)];
    const b = rs[Math.min(rs.length - 1, ri + 1)];
    const dy = b.yCm - a.yCm;
    const dr = b.radiusCm - a.radiusCm;
    const r = Math.max(round.radiusCm, 0.05);
    const n = round.stitches;
    const step = Math.max(1, Math.round(thin));
    const w = ((2 * Math.PI * r) / n) * step;
    for (let j = 0; j < n; j += step) {
      const ang = ((j + ri * 0.5) / n) * Math.PI * 2;
      const c = Math.cos(ang);
      const s = Math.sin(ang);
      let nrm: V3;
      if (Math.abs(dy) < 1e-3) nrm = [0, round.yCm < mid ? -1 : 1, 0];
      else nrm = norm([c * dy, -dr, (s * dy) / zs]);
      out.push({ p: [c * r, round.yCm, s * r * zs], n: nrm, t: norm([-s, 0, c * zs]), w: Math.max(w, 0.1), h: rowH, row: ri });
    }
  });
  return out;
}

interface Box {
  min: V3;
  max: V3;
}
const emptyBox = (): Box => ({ min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] });
function grow(b: Box, p: V3) {
  for (let i = 0; i < 3; i++) {
    b.min[i] = Math.min(b.min[i], p[i]);
    b.max[i] = Math.max(b.max[i], p[i]);
  }
}

/** A flat unit (one rectangle or granny square copy) as a stitch grid: cols × rows, size in cm. */
interface Unit {
  part: PartPattern;
  spec: EnginePart;
  w: number;
  h: number;
  cols: number;
  rows: number;
}

function unitOf(part: PartPattern, spec: EnginePart, stitchW: number, rowH: number): Unit {
  if (part.kind === "granny_square") {
    const side = Math.max(spec.widthCm, spec.heightCm);
    const n = Math.max(3, Math.round(side / stitchW));
    return { part, spec, w: side, h: side, cols: n, rows: Math.max(3, Math.round(side / rowH)) };
  }
  const cols = part.rounds[0]?.stitches ?? 2;
  const rows = part.rounds.length;
  return { part, spec, w: cols * stitchW, h: rows * rowH, cols, rows };
}

/**
 * Lays one unit's stitches on a surface. `at(u, v)` gives the point for u, v in 0..1 (u across,
 * v up); `normal` is the outward direction. Granny squares get a subtle ring-by-ring shade.
 */
function unitStitches(unit: Unit, thin: number, at: (u: number, v: number) => { p: V3; n: V3; t: V3 }, out: Draft[], order: number, sheets?: SheetDraft[]) {
  if (sheets) sheets.push(sheetOf(at, 12, 12, unit.part.colorHex, order, Math.min(unit.w / unit.cols, unit.h / unit.rows) * 0.35));
  const step = Math.max(1, Math.round(Math.sqrt(thin)));
  const w = (unit.w / unit.cols) * step;
  const h = (unit.h / unit.rows) * step;
  for (let r = 0; r < unit.rows; r += step) {
    for (let c = 0; c < unit.cols; c += step) {
      const u = (c + 0.5 + (r % 2) * 0.25) / unit.cols;
      const v = (r + 0.5) / unit.rows;
      const s = at(Math.min(1, u), v);
      out.push({ ...s, w, h, color: unit.part.colorHex, order: order + r / unit.rows });
    }
  }
}

/** Columns and rows for n tiles with no empty slot when possible (3 → 3×1, 4 → 2×2, 6 → 3×2). */
export function gridOf(n: number): { cols: number; rows: number } {
  for (let c = Math.ceil(Math.sqrt(n)); c <= Math.min(n, 4); c++) if (n % c === 0) return { cols: c, rows: n / c };
  const cols = Math.ceil(Math.sqrt(n));
  return { cols, rows: Math.ceil(n / cols) };
}

interface SheetDraft {
  grid: V3[];
  nu: number;
  nv: number;
  color: string;
  order: number;
}

/** A backing sheet sampled from a surface, set just behind the stitches. */
function sheetOf(at: (u: number, v: number) => { p: V3; n: V3 }, nu: number, nv: number, color: string, order: number, inset: number): SheetDraft {
  const grid: V3[] = [];
  for (let j = 0; j < nv; j++)
    for (let i = 0; i < nu; i++) {
      const s = at(i / (nu - 1), j / (nv - 1));
      grid.push(add(s.p, scale(s.n, -inset)));
    }
  return { grid, nu, nv, color, order };
}

/** Semi-ellipse arch from (-a, 0) over the top to (a, 0), sampled by arc length. */
function archPath(a: number, length: number): (s: number) => { p: [number, number]; d: [number, number] } {
  const half = (b: number) => (Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)))) / 2;
  let lo = a * 0.05;
  let hi = a * 30;
  if (half(lo) >= length) hi = lo;
  else for (let i = 0; i < 40; i++) (half((lo + hi) / 2) < length ? (lo = (lo + hi) / 2) : (hi = (lo + hi) / 2));
  const b = (lo + hi) / 2;
  const N = 240;
  const pts: [number, number][] = [];
  const cum: number[] = [0];
  for (let i = 0; i <= N; i++) {
    const th = Math.PI - (i / N) * Math.PI;
    pts.push([a * Math.cos(th), b * Math.sin(th)]);
    if (i) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  }
  const total = cum[N];
  return (s) => {
    const target = Math.min(1, Math.max(0, s)) * total;
    let i = 1;
    while (i < N && cum[i] < target) i++;
    const k = (target - cum[i - 1]) / Math.max(1e-6, cum[i] - cum[i - 1]);
    const p: [number, number] = [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k];
    const dl = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]) || 1;
    return { p, d: [(pts[i][0] - pts[i - 1][0]) / dl, (pts[i][1] - pts[i - 1][1]) / dl] };
  };
}

export function buildPiece(pattern: Pattern, parts: EnginePart[], make: Make, rowH: number, stitchW: number): Piece {
  const specOf = new Map(parts.map((p) => [p.id, p]));
  const total = pattern.parts.reduce((n, p) => n + (p.kind === "revolution" ? p.totalStitches : p.totalStitches * 1.6) * p.quantity, 0);
  const thin = Math.max(1, total / PIECE_MAX_STITCHES);
  const drafts: Draft[] = [];
  const bodies: (Omit<PieceBody, "from" | "to"> & { order: number })[] = [];
  const sheets: SheetDraft[] = [];
  const eyes: { p: V3; r: number }[] = [];
  let order = 0;

  const straps = pattern.parts.filter((p) => {
    const s = specOf.get(p.partId);
    return !!s && isStrap(s, make);
  });
  const strapIds = new Set(straps.map((p) => p.partId));

  // 1. Parts worked in the round, assembled as the engine attaches them.
  const roundParts = pattern.parts.filter((p) => p.kind === "revolution" && !strapIds.has(p.partId));
  const roundSpecs = parts.filter((p) => roundParts.some((r) => r.partId === p.id));
  const placed = assemblyLayout({ ...pattern, parts: roundParts }, roundSpecs, 0);
  const byId = new Map(roundParts.map((p) => [p.partId, p]));
  const body = emptyBox();
  for (const pl of placed) {
    const part = byId.get(pl.partId)!;
    const spec = specOf.get(pl.partId)!;
    const zs = Math.min(1, Math.max(0.4, spec.depthCm / Math.max(0.1, spec.widthCm)));
    const local = ringStitches(part, zs, rowH, thin);
    const rows = part.rounds.length;
    for (const s of local) {
      const p = add(pl.origin, fromUp(pl.up, s.p));
      grow(body, p);
      drafts.push({ p, n: fromUp(pl.up, s.n), t: fromUp(pl.up, s.t), w: s.w, h: s.h, color: part.colorHex, order: order + s.row / rows });
    }
    // Toys get safety eyes on the head (or on a single ball), as they are finished.
    if (make === "toy" && pl.copy === 0 && (/head|راس|رأس/i.test(spec.name) || roundParts.length === 1)) {
      const H = part.rounds[part.rounds.length - 1].yCm;
      const ring = part.rounds.reduce((best, r) => (Math.abs(r.yCm - H * 0.55) < Math.abs(best.yCm - H * 0.55) ? r : best), part.rounds[0]);
      for (const side of [1, -1]) {
        const a = side * 0.32;
        const local: V3 = [Math.sin(a) * ring.radiusCm, ring.yCm, Math.cos(a) * ring.radiusCm * zs];
        eyes.push({ p: add(pl.origin, fromUp(pl.up, local)), r: Math.max(0.35, ring.radiusCm * 0.11) });
      }
    }
    bodies.push({ profile: part.rounds.map((r) => [r.radiusCm * 0.94, r.yCm]), grid: [], nu: 0, nv: 0, zs, origin: pl.origin, up: pl.up, color: part.colorHex, open: !part.closed, order });
    order += 1;
  }

  // 2. Flat panels: the faces of a bag, the pieces of a garment, or a flat piece on its own.
  const units: Unit[] = [];
  for (const part of pattern.parts) {
    if (part.kind === "revolution" || strapIds.has(part.partId)) continue;
    const spec = specOf.get(part.partId);
    if (!spec) continue;
    for (let q = 0; q < part.quantity; q++) units.push(unitOf(part, spec, stitchW, rowH));
  }

  const face = (list: Unit[], z: number, dir: 1 | -1, bulge: number, top: number, cx = 0) => {
    // Tiles a list of units into one face: squares in a grid, rectangles stacked.
    if (!list.length) return;
    const { cols, rows: rowsN } = gridOf(list.length);
    const cw = Math.max(...list.map((u) => u.w));
    const ch = Math.max(...list.map((u) => u.h));
    const W = cw * cols;
    const H = ch * rowsN;
    list.forEach((u, i) => {
      const gx = i % cols;
      const gy = rowsN - 1 - Math.floor(i / cols);
      const x0 = cx - W / 2 + gx * cw + (cw - u.w) / 2;
      const y0 = top - H + gy * ch;
      unitStitches(
        u,
        thin,
        (uu, vv) => {
          const x = x0 + uu * u.w;
          const y = y0 + vv * u.h;
          const fx = (x - cx) / (W / 2);
          const fy = (y - (top - H / 2)) / (H / 2);
          const swell = bulge * Math.max(0, 1 - fx * fx) * Math.max(0, 1 - fy * fy * 0.6);
          const p: V3 = [x, y, z + dir * swell];
          return { p, n: norm([dir * fx * bulge * 0.8 / Math.max(1, W / 2), 0, dir]), t: [1, 0, 0] };
        },
        drafts,
        order,
        sheets,
      );
      order += 0.6;
    });
    for (let i = 0; i < 2; i++) grow(body, [cx - W / 2, top - H, z]), grow(body, [cx + W / 2, top, z + dir * bulge]);
  };

  if (units.length) {
    if (make === "bag" || (make === "other" && straps.length > 0 && !roundParts.length)) {
      const front = units.filter((_, i) => i % 2 === 0);
      const back = units.filter((_, i) => i % 2 === 1);
      const fw = Math.max(...units.map((u) => u.w));
      const g = fw * 0.1;
      const H = Math.max(...units.map((u) => u.h)) * gridOf(front.length).rows;
      face(front, g, 1, g * 0.8, H);
      face(back.length ? back : front, -g, -1, g * 0.8, H);
    } else if (make === "clothes") {
      const sleeves = units.filter((u) => SLEEVE.test(u.spec.name));
      const rest = units.filter((u) => !SLEEVE.test(u.spec.name));
      const backs = rest.filter((u) => BACK.test(u.spec.name));
      let fronts = rest.filter((u) => !BACK.test(u.spec.name));
      let backList = backs;
      if (!backs.length) {
        // No named back: split evenly (granny vests, plain tops).
        backList = fronts.filter((_, i) => i % 2 === 1);
        fronts = fronts.filter((_, i) => i % 2 === 0);
      }
      const twoFronts = fronts.length === 2 && fronts.every((u) => FRONT.test(u.spec.name));
      const W = backList.length ? Math.max(...backList.map((u) => u.w)) : twoFronts ? fronts[0].w * 2 : Math.max(...rest.map((u) => u.w), 10);
      const H = Math.max(...rest.map((u) => u.h), 10);
      const g = W * 0.09;
      if (twoFronts) {
        // Cardigan: two front panels, a small gap down the middle.
        face([fronts[0]], g, 1, g * 0.5, H, -fronts[0].w / 2 - 0.4);
        face([fronts[1]], g, 1, g * 0.5, H, fronts[1].w / 2 + 0.4);
      } else face(fronts, g, 1, g * 0.6, H);
      face(backList.length ? backList : fronts, -g, -1, g * 0.6, H);
      sleeves.forEach((u, i) => {
        const side = i % 2 === 0 ? 1 : -1;
        const tilt = side * (Math.PI / 2 - 0.45);
        unitStitches(
          u,
          thin,
          (uu, vv) => {
            // The sleeve hangs from the shoulder, outward and down, wrapped into a soft tube.
            const along = (1 - vv) * u.h;
            const ang = uu * Math.PI * 2;
            const rr = u.w / (2 * Math.PI);
            const local: V3 = [Math.cos(ang) * rr, -along, Math.sin(ang) * rr * 0.7];
            const p = add([side * (W / 2), H - rr, 0], rotZ(local, tilt));
            return { p, n: rotZ(norm([Math.cos(ang), 0, Math.sin(ang)]), tilt), t: rotZ([0, 1, 0], tilt) };
          },
          drafts,
          order,
          sheets,
        );
        order += 0.6;
      });
      grow(body, [-W / 2, 0, -g]);
      grow(body, [W / 2, H, g]);
    } else {
      // Flat pieces lie gently draped, side by side.
      const W = units.reduce((s, u) => s + u.w, 0) + (units.length - 1) * 2;
      let x = -W / 2;
      units.forEach((u) => {
        const x0 = x;
        unitStitches(
          u,
          thin,
          (uu, vv) => {
            const px = x0 + uu * u.w;
            const py = vv * u.h;
            const wave = Math.sin(uu * Math.PI * 2 + vv * 2) * Math.min(u.w, u.h) * 0.02;
            return { p: [px, py, wave], n: [0, 0, 1], t: [1, 0, 0] };
          },
          drafts,
          order,
          sheets,
        );
        order += 0.6;
        grow(body, [x0, 0, 0]);
        grow(body, [x0 + u.w, u.h, 0]);
        x += u.w + 2;
      });
    }
  }

  // 3. Straps and handles: arches over the body (shoulder straps go over the shoulder).
  const hasBody = body.min[0] !== Infinity;
  const B = hasBody ? body : { min: [-5, 0, -2] as V3, max: [5, 10, 2] as V3 };
  const halfW = (B.max[0] - B.min[0]) / 2;
  const halfD = (B.max[2] - B.min[2]) / 2;
  const cx = (B.min[0] + B.max[0]) / 2;
  const cz = (B.min[2] + B.max[2]) / 2;
  for (const part of straps) {
    const spec = specOf.get(part.partId)!;
    const length = Math.max(spec.heightCm, 4);
    const tube = part.kind === "revolution";
    const across = tube ? Math.max(6, Math.max(...part.rounds.map((r) => r.stitches))) : Math.max(2, part.rounds[0]?.stitches ?? 3);
    const bandW = tube ? spec.widthCm : across * stitchW;
    const rows = Math.max(4, Math.round(length / rowH));
    const shoulder = make === "clothes";
    for (let q = 0; q < part.quantity; q++) {
      let path: (s: number) => { p: [number, number]; d: [number, number] };
      let place: (x: number, y: number, off: number) => { p: V3; across: V3; normalOut: (dx: number, dy: number) => V3 };
      if (shoulder) {
        const side = q % 2 === 0 ? 1 : -1;
        const sx = cx + side * halfW * 0.45;
        path = archPath(Math.max(halfD, 1), Math.max(length, halfD * Math.PI * 0.6));
        place = (x, y, off) => ({ p: [sx + off, B.max[1] - rowH + y, cz + x], across: [1, 0, 0], normalOut: (dx, dy) => [0, dx, -dy] });
      } else {
        const ends = Math.min(0.95, Math.max(0.25, Math.abs(spec.position.x) || 0.55)) * halfW;
        const z = part.quantity > 1 ? cz + (q % 2 === 0 ? 1 : -1) * halfD * 0.85 : cz;
        path = archPath(ends, Math.max(length, ends * 2.2));
        place = (x, y, off) => ({ p: [cx + x, B.max[1] - rowH * 1.5 + y, z + off], across: [0, 0, 1], normalOut: (dx, dy) => [dy, -dx, 0] });
      }
      const stepR = Math.max(1, Math.round(Math.sqrt(thin)));
      sheets.push(
        sheetOf(
          (u, v) => {
            const at = path(v);
            const base = place(at.p[0], at.p[1], (u - 0.5) * bandW * (tube ? 0.8 : 1));
            const outward = norm(base.normalOut(at.d[0], at.d[1]));
            return { p: base.p, n: outward };
          },
          tube ? 3 : 4,
          40,
          part.colorHex,
          order,
          -rowH * 0.05,
        ),
      );
      for (let r = 0; r < rows; r += stepR) {
        const at = path((r + 0.5) / rows);
        for (let c = 0; c < across; c += stepR) {
          let off: number;
          let n: V3;
          const base = place(at.p[0], at.p[1], 0);
          const outward = norm(base.normalOut(at.d[0], at.d[1]));
          if (tube) {
            const ang = (c / across) * Math.PI * 2;
            const rr = bandW / 2;
            off = Math.cos(ang) * rr;
            const lift = Math.sin(ang) * rr;
            const pl = place(at.p[0], at.p[1], off);
            const p = add(pl.p, scale(outward, lift));
            n = norm(add(scale(pl.across, Math.cos(ang)), scale(outward, Math.sin(ang))));
            drafts.push({ p, n, t: norm(base.across), w: (Math.PI * bandW) / across * stepR, h: rowH * stepR, color: part.colorHex, order: order + r / rows });
          } else {
            off = (c / Math.max(1, across - 1) - 0.5) * bandW;
            const pl = place(at.p[0], at.p[1], off);
            n = outward;
            const p = add(pl.p, scale(outward, rowH * 0.2));
            drafts.push({ p, n, t: norm(pl.across), w: stitchW * stepR, h: rowH * stepR, color: part.colorHex, order: order + r / rows });
          }
        }
      }
      order += 1;
    }
  }

  // Timeline: parts one after another, each by its rows; weighted by how many stitches it has.
  drafts.sort((a, b) => a.order - b.order);
  // Hard cap for very large pieces (big blankets): keep every k-th stitch, each a little larger.
  if (drafts.length > PIECE_MAX_STITCHES) {
    const k = Math.ceil(drafts.length / PIECE_MAX_STITCHES);
    const grow = Math.sqrt(k);
    const kept = drafts.filter((_, i) => i % k === 0).map((d) => ({ ...d, w: d.w * grow, h: d.h * grow }));
    drafts.length = 0;
    drafts.push(...kept);
  }
  const n = drafts.length;
  const stitches: PieceStitch[] = drafts.map((d, i) => ({ p: d.p, n: d.n, t: d.t, w: d.w, h: d.h, color: d.color, at: n > 1 ? i / (n - 1) : 0 }));
  const firstAt = new Map<number, number>();
  const lastAt = new Map<number, number>();
  drafts.forEach((d, i) => {
    const k = Math.floor(d.order);
    if (!firstAt.has(k)) firstAt.set(k, stitches[i].at);
    lastAt.set(k, stitches[i].at);
  });

  const box = emptyBox();
  stitches.forEach((s) => grow(box, s.p));
  const center: V3 = box.min[0] === Infinity ? [0, 0, 0] : [(box.min[0] + box.max[0]) / 2, (box.min[1] + box.max[1]) / 2, (box.min[2] + box.max[2]) / 2];
  const size = box.min[0] === Infinity ? 1 : Math.max(box.max[0] - box.min[0], box.max[1] - box.min[1], box.max[2] - box.min[2], 1);

  return {
    eyes,
    stitches,
    bodies: [
      ...bodies.map((b) => ({ ...b, from: firstAt.get(b.order) ?? 0, to: lastAt.get(b.order) ?? 1 })),
      ...sheets.map((sh) => {
        const k = Math.floor(sh.order);
        return { profile: [], grid: sh.grid, nu: sh.nu, nv: sh.nv, zs: 1, origin: [0, 0, 0] as V3, up: [0, 1, 0] as V3, color: sh.color, open: true, from: firstAt.get(k) ?? 0, to: lastAt.get(k) ?? 1 };
      }),
    ],
    center,
    size,
  };
}

/** What kind of piece a saved result is, for older results that did not record it. */
export function guessMake(parts: EnginePart[]): Make {
  if (parts.some((p) => SLEEVE.test(p.name))) return "clothes";
  if (parts.some((p) => STRAP_WORDS.test(p.name))) return "bag";
  if (parts.every((p) => p.shape === "rectangle" || p.shape === "granny_square")) return "flat";
  return "toy";
}
