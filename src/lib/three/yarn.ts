// Pure helpers for the hero yarn ball: strand paths and loose-thread spring physics.
// No React here, so it can be unit tested.

export type Vec3 = [number, number, number];

/** Small deterministic random generator (LCG), so the ball looks the same on every visit. */
export function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

function normalize(v: Vec3): Vec3 {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

/** A random point on the unit sphere. */
export function randomDirection(rand: () => number): Vec3 {
  const u = rand() * 2 - 1;
  const t = rand() * Math.PI * 2;
  const r = Math.sqrt(1 - u * u);
  return [r * Math.cos(t), u, r * Math.sin(t)];
}

/**
 * One wound strand: a slightly wavy great circle around the ball.
 * Returns closed-loop points for a Catmull-Rom curve.
 */
export function strandPoints(rand: () => number, radius: number, samples = 48, normal?: Vec3, shell?: number): Vec3[] {
  const n = normal ?? randomDirection(rand);
  const helper: Vec3 = Math.abs(n[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  const u = normalize(cross(n, helper));
  const v = normalize(cross(n, u));
  const r = shell ?? radius * (0.93 + rand() * 0.07);
  const waves = 2 + Math.floor(rand() * 3);
  const amp = radius * (0.02 + rand() * 0.03);
  const phase = rand() * Math.PI * 2;
  const pts: Vec3[] = [];
  for (let i = 0; i < samples; i++) {
    const t = (i / samples) * Math.PI * 2;
    const w = Math.sin(t * waves + phase) * amp;
    const p: Vec3 = [
      r * (Math.cos(t) * u[0] + Math.sin(t) * v[0]) + w * n[0],
      r * (Math.cos(t) * u[1] + Math.sin(t) * v[1]) + w * n[1],
      r * (Math.cos(t) * u[2] + Math.sin(t) * v[2]) + w * n[2],
    ];
    // Keep every point on the shell of the ball.
    const len = Math.hypot(p[0], p[1], p[2]);
    pts.push([(p[0] / len) * r, (p[1] / len) * r, (p[2] / len) * r]);
  }
  return pts;
}

/**
 * Real yarn balls are wound in bands: many nearly parallel strands around one axis,
 * then the winder turns the ball and starts a new band. Returns one normal per strand.
 */
export function bandNormals(rand: () => number, bands: number, perBand: number, jitter = 0.32): Vec3[] {
  const out: Vec3[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let b = 0; b < bands; b++) {
    // Band axes spread evenly over the sphere (Fibonacci lattice), so no patch is left bare.
    const y = 1 - ((b + 0.5) / bands) * 2;
    const r = Math.sqrt(1 - y * y);
    const axis: Vec3 = [Math.cos(b * golden) * r, y, Math.sin(b * golden) * r];
    for (let k = 0; k < perBand; k++) {
      out.push(
        normalize([
          axis[0] + (rand() * 2 - 1) * jitter,
          axis[1] + (rand() * 2 - 1) * jitter,
          axis[2] + (rand() * 2 - 1) * jitter,
        ]),
      );
    }
  }
  return out;
}

/** A loose thread: a chain of points simulated with Verlet integration. */
export interface Thread {
  pos: Float32Array;
  prev: Float32Array;
  count: number;
  segment: number;
}

export function createThread(anchor: Vec3, direction: Vec3, count: number, segment: number): Thread {
  const pos = new Float32Array(count * 3);
  const d = normalize(direction);
  for (let i = 0; i < count; i++) {
    // Start pointing outward, then curl downward a little.
    const k = i * segment;
    pos[i * 3] = anchor[0] + d[0] * k;
    pos[i * 3 + 1] = anchor[1] + d[1] * k - 0.02 * i * i * segment;
    pos[i * 3 + 2] = anchor[2] + d[2] * k;
  }
  return { pos, prev: new Float32Array(pos), count, segment };
}

export interface StepOptions {
  gravity: number;
  damping: number;
  wind: Vec3;
  iterations: number;
  /** Keeps the thread outside the ball. */
  collider?: { center: Vec3; radius: number };
}

/**
 * Advances a thread by dt seconds. Point 0 is pinned to `anchor` (a point on the ball surface
 * in world space); the rest swing with gravity, wind and damping while keeping segment length.
 */
export function stepThread(t: Thread, anchor: Vec3, dt: number, o: StepOptions): void {
  const { pos, prev, count, segment } = t;
  const dt2 = Math.min(dt, 1 / 30) ** 2;
  for (let i = 1; i < count; i++) {
    const ix = i * 3;
    for (let a = 0; a < 3; a++) {
      const cur = pos[ix + a];
      const vel = (cur - prev[ix + a]) * o.damping;
      prev[ix + a] = cur;
      const acc = (a === 1 ? -o.gravity : 0) + o.wind[a];
      pos[ix + a] = cur + vel + acc * dt2;
    }
  }
  pos[0] = anchor[0];
  pos[1] = anchor[1];
  pos[2] = anchor[2];
  prev[0] = anchor[0];
  prev[1] = anchor[1];
  prev[2] = anchor[2];
  for (let k = 0; k < o.iterations; k++) {
    for (let i = 0; i < count - 1; i++) {
      const a = i * 3;
      const b = (i + 1) * 3;
      const dx = pos[b] - pos[a];
      const dy = pos[b + 1] - pos[a + 1];
      const dz = pos[b + 2] - pos[a + 2];
      const dist = Math.hypot(dx, dy, dz) || 1e-6;
      const diff = (dist - segment) / dist;
      if (i === 0) {
        pos[b] -= dx * diff;
        pos[b + 1] -= dy * diff;
        pos[b + 2] -= dz * diff;
      } else {
        const h = diff * 0.5;
        pos[a] += dx * h;
        pos[a + 1] += dy * h;
        pos[a + 2] += dz * h;
        pos[b] -= dx * h;
        pos[b + 1] -= dy * h;
        pos[b + 2] -= dz * h;
      }
    }
    if (o.collider) {
      const { center, radius } = o.collider;
      for (let i = 2; i < count; i++) {
        const ix = i * 3;
        const dx = pos[ix] - center[0];
        const dy = pos[ix + 1] - center[1];
        const dz = pos[ix + 2] - center[2];
        const d = Math.hypot(dx, dy, dz);
        if (d < radius && d > 1e-6) {
          const s = radius / d;
          pos[ix] = center[0] + dx * s;
          pos[ix + 1] = center[1] + dy * s;
          pos[ix + 2] = center[2] + dz * s;
        }
      }
    }
  }
}

/** Exponential damping toward a target, frame-rate independent. */
export function damp(current: number, target: number, lambda: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}
