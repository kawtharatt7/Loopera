"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import { BufferGeometry, CatmullRomCurve3, Color, Group, Matrix4, TubeGeometry, Vector3 } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { Line2 } from "three/examples/jsm/lines/Line2.js";
import { tokenHex, type PaletteToken } from "@/lib/theme-colors";
import { bandNormals, createThread, damp, seeded, stepThread, strandPoints, type Thread, type Vec3 } from "@/lib/three/yarn";

export interface PointerState {
  /** Pointer position, -1..1 on both axes, relative to the viewport. */
  x: number;
  y: number;
  /** performance.now() of the last pointer move. */
  lastMove: number;
  /** Accumulated drag rotation from touch, radians. */
  dragYaw: number;
  dragPitch: number;
}

interface SceneProps {
  pointer: MutableRefObject<PointerState>;
  animate: boolean;
  compact: boolean;
}

const RADIUS = 1.2;
const STRAND_TOKENS: PaletteToken[] = ["ember", "peach", "rose", "ember", "wine", "peach", "rose"];
const THREAD_TOKENS: PaletteToken[] = ["peach", "rose", "ember", "peach"];

// Where each loose thread leaves the ball (local space) and the way it first points.
const THREAD_ANCHORS: { at: Vec3; dir: Vec3 }[] = [
  { at: [0.55, -0.75, 0.38], dir: [0.9, -0.3, 0.2] },
  { at: [-0.7, -0.5, 0.5], dir: [-0.9, -0.2, 0.3] },
  { at: [0.2, -0.95, -0.2], dir: [0.2, -1, 0.1] },
  { at: [-0.35, 0.2, 0.92], dir: [-0.4, -0.6, 1] },
];

function YarnBall({ pointer, animate, compact }: SceneProps) {
  const group = useRef<Group>(null);
  const lines = useRef<(Line2 | null)[]>([]);
  const rot = useRef({ x: 0.25, y: 0, idle: 0 });
  const { viewport } = useThree();

  // Strands are merged into one mesh per color: about a hundred strands, only a few draw calls.
  const strands = useMemo(() => {
    const rand = seeded(11);
    const bands = compact ? 8 : 11;
    const perBand = compact ? 9 : 12;
    const segments = compact ? 80 : 130;
    const normals = bandNormals(rand, bands, perBand);
    const byToken = new Map<PaletteToken, BufferGeometry[]>();
    normals.forEach((n, i) => {
      const band = Math.floor(i / perBand);
      // Later bands sit on a slightly larger shell, so they lie on top of earlier ones like real winding.
      const shell = RADIUS * (0.9 + 0.1 * (band / Math.max(1, bands - 1))) + rand() * 0.004;
      const pts = strandPoints(rand, RADIUS, 40, n, shell).map((p) => new Vector3(...p));
      const geo = new TubeGeometry(new CatmullRomCurve3(pts, true, "catmullrom", 0.5), segments, 0.04, compact ? 5 : 6, true);
      // Each band is wound from one color, with an occasional strand of another for depth.
      const token = rand() < 0.8 ? STRAND_TOKENS[band % STRAND_TOKENS.length] : STRAND_TOKENS[(band + 3) % STRAND_TOKENS.length];
      const list = byToken.get(token) ?? [];
      list.push(geo);
      byToken.set(token, list);
    });
    return [...byToken.entries()].map(([token, geos]) => {
      const merged = mergeGeometries(geos) ?? geos[0];
      if (merged !== geos[0]) geos.forEach((g) => g.dispose());
      return { geo: merged, color: new Color(tokenHex(token)) };
    });
  }, [compact]);

  useEffect(() => () => strands.forEach((s) => s.geo.dispose()), [strands]);

  const coreColor = useMemo(() => new Color(tokenHex("wine")), []);
  const threadColors = useMemo(() => THREAD_TOKENS.map((t) => tokenHex(t)), []);

  const threads = useRef<Thread[] | null>(null);
  const tmpMatrix = useMemo(() => new Matrix4(), []);
  const tmpVec = useMemo(() => new Vector3(), []);

  // The ball sits in the middle of the hero, above the headline.
  const offset: Vec3 = [0, viewport.height * 0.13, 0];
  const scale = Math.min((viewport.height * 0.5) / (2 * RADIUS), (viewport.width * 0.72) / (2 * RADIUS));

  const worldAnchor = (i: number): Vec3 => {
    const g = group.current;
    const a = THREAD_ANCHORS[i].at;
    tmpVec.set(a[0], a[1], a[2]).normalize().multiplyScalar(RADIUS * 0.98);
    if (g) {
      g.updateMatrixWorld();
      tmpMatrix.copy(g.matrixWorld);
      tmpVec.applyMatrix4(tmpMatrix);
    }
    return [tmpVec.x, tmpVec.y, tmpVec.z];
  };

  if (threads.current === null) {
    threads.current = THREAD_ANCHORS.map((t, i) =>
      createThread(
        [offset[0] + t.at[0] * RADIUS, offset[1] + t.at[1] * RADIUS, t.at[2] * RADIUS],
        t.dir,
        compact ? 16 : 22,
        i === 2 ? 0.065 : 0.08,
      ),
    );
  }

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const dt = Math.min(delta, 1 / 20);
    const p = pointer.current;
    const still = performance.now() - p.lastMove > 1800;
    const r = rot.current;

    if (animate) {
      r.idle += dt * (still ? 0.18 : 0.06);
      const ty = (still ? 0 : p.x * 0.65) + p.dragYaw;
      const tx = 0.25 + (still ? Math.sin(state.clock.elapsedTime * 0.4) * 0.06 : -p.y * 0.4) + p.dragPitch;
      r.y = damp(r.y, ty, 2.6, dt);
      r.x = damp(r.x, tx, 2.6, dt);
    }
    g.rotation.set(r.x, r.y + r.idle, 0);
    g.position.set(offset[0], offset[1], 0);
    g.scale.setScalar(scale);

    const ts = threads.current;
    if (!ts) return;
    const t = state.clock.elapsedTime;
    const center: Vec3 = [offset[0], offset[1], 0];
    ts.forEach((thread, i) => {
      const steps = animate ? 2 : 0;
      for (let s = 0; s < steps; s++) {
        stepThread(thread, worldAnchor(i), dt / 2, {
          gravity: 3.4,
          damping: 0.94,
          // A gentle breeze that pulls each thread away from the ball and sways it.
          wind: [
            THREAD_ANCHORS[i].dir[0] * 1.1 + Math.sin(t * 0.6 + i * 1.7) * 0.6,
            0,
            THREAD_ANCHORS[i].dir[2] * 0.8 + Math.cos(t * 0.45 + i) * 0.4,
          ],
          iterations: 6,
          collider: { center, radius: RADIUS * scale * 1.02 },
        });
      }
      const line = lines.current[i];
      if (line) line.geometry.setPositions(thread.pos);
    });
  });

  const initialPoints = (i: number): Vec3[] => {
    const th = threads.current?.[i];
    if (!th) return [[0, 0, 0], [0, -1, 0]];
    const out: Vec3[] = [];
    for (let k = 0; k < th.count; k++) out.push([th.pos[k * 3], th.pos[k * 3 + 1], th.pos[k * 3 + 2]]);
    return out;
  };

  return (
    <>
      <group ref={group}>
        <mesh>
          <sphereGeometry args={[RADIUS * 0.89, compact ? 24 : 40, compact ? 16 : 28]} />
          <meshStandardMaterial color={coreColor} roughness={0.95} />
        </mesh>
        {strands.map((s, i) => (
          <mesh key={i} geometry={s.geo}>
            <meshStandardMaterial color={s.color} roughness={0.85} metalness={0} />
          </mesh>
        ))}
      </group>
      {THREAD_ANCHORS.map((_, i) => (
        <Line
          key={i}
          ref={(el) => {
            lines.current[i] = el as unknown as Line2 | null;
          }}
          points={initialPoints(i)}
          color={threadColors[i]}
          lineWidth={0.05 * scale}
          worldUnits
        />
      ))}
    </>
  );
}

export default function YarnBallScene({ pointer, animate, running, compact }: SceneProps & { running: boolean }) {
  const glow = useMemo(() => tokenHex("ember"), []);
  const key = useMemo(() => tokenHex("rose"), []);
  return (
    <Canvas
      dpr={[1, compact ? 1.5 : 1.75]}
      frameloop={running && animate ? "always" : "demand"}
      camera={{ position: [0, 0, 5.2], fov: 40 }}
      gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      aria-hidden="true"
    >
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 4, 5]} intensity={1.6} color={key} />
      <directionalLight position={[-4, -2, -3]} intensity={1.1} color={glow} />
      <YarnBall pointer={pointer} animate={animate} compact={compact} />
    </Canvas>
  );
}
