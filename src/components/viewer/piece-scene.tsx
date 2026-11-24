"use client";

import { ContactShadows, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { BufferGeometry, Color, DoubleSide, Float32BufferAttribute, InstancedMesh, LatheGeometry, Matrix4, MeshStandardMaterial, Quaternion, SphereGeometry, Vector2, Vector3, type Group, type Mesh } from "three";
import type { EnginePart, Pattern } from "@/lib/engine/types";
import { buildPiece, type Make, type Piece, type PieceStitch } from "@/lib/viewer/piece";

/*
  The finished piece, forming before your eyes: stitches appear in the order they are worked,
  part after part, round after round, until the whole bag, toy or garment stands there. Each
  stitch is a small "V" of two yarn loops lying on the surface, so it reads as crochet.
*/

interface Props {
  pattern: Pattern;
  parts: EnginePart[];
  make: Make;
  rowHeightCm: number;
  stitchWidthCm: number;
  /** Changes to replay the build. */
  run: number;
  reduceMotion: boolean;
  onDone?: () => void;
}

/** One crochet stitch: two slanted loops side by side, like the "V" you see on the fabric. */
function stitchGeometry() {
  const loop = (side: number) => {
    const g = new SphereGeometry(0.5, 8, 6);
    g.scale(0.34, 0.62, 0.42);
    g.rotateZ(side * 0.42);
    g.translate(side * 0.2, 0, 0);
    return g;
  };
  return mergeGeometries([loop(1), loop(-1)])!;
}

const m4 = new Matrix4();
const q = new Quaternion();
const sc = new Vector3();
const pos = new Vector3();
const basis = new Matrix4();
const X = new Vector3();
const Y = new Vector3();
const Z = new Vector3();

function place(mesh: InstancedMesh, i: number, s: PieceStitch, g: number) {
  // Stitch axes: x along the row, y up the fabric, z out of the surface.
  Z.set(s.n[0], s.n[1], s.n[2]).normalize();
  X.set(s.t[0], s.t[1], s.t[2]);
  X.addScaledVector(Z, -X.dot(Z)).normalize();
  Y.crossVectors(Z, X).normalize();
  basis.makeBasis(X, Y, Z);
  q.setFromRotationMatrix(basis);
  pos.set(s.p[0], s.p[1], s.p[2]).addScaledVector(Z, (1 - g) * s.h * 2.5);
  sc.set(s.w * 1.3 * g, s.h * 1.7 * g, Math.min(s.w, s.h) * 0.95 * g);
  m4.compose(pos, q, sc);
  mesh.setMatrixAt(i, m4);
}

function Build({ piece, run, reduceMotion, onDone }: { piece: Piece; run: number; reduceMotion: boolean; onDone?: () => void }) {
  const mesh = useRef<InstancedMesh>(null);
  const group = useRef<Group>(null);
  const bodyRefs = useRef<(Mesh | null)[]>([]);
  const eyeRefs = useRef<(Mesh | null)[]>([]);
  const geometry = useMemo(stitchGeometry, []);
  const n = piece.stitches.length;
  const duration = Math.min(9, Math.max(4.5, n / 1600));
  const clock = useRef({ start: 0, lo: 0, done: false });
  const FADE = 0.035;

  const bodyGeos = useMemo(
    () =>
      piece.bodies.map((b) => {
        if (!b.profile.length) {
          // A sheet behind flat panels and straps.
          const g = new BufferGeometry();
          g.setAttribute("position", new Float32BufferAttribute(b.grid.flat(), 3));
          const idx: number[] = [];
          for (let j = 0; j < b.nv - 1; j++)
            for (let i = 0; i < b.nu - 1; i++) {
              const a = j * b.nu + i;
              idx.push(a, a + 1, a + b.nu, a + 1, a + b.nu + 1, a + b.nu);
            }
          g.setIndex(idx);
          g.computeVertexNormals();
          return g;
        }
        const pts = b.profile.map(([r, y]) => new Vector2(Math.max(0.01, r), y));
        const g = new LatheGeometry(pts, 48);
        g.scale(1, 1, b.zs);
        return g;
      }),
    [piece],
  );

  // Every stitch starts hidden (or in place when motion is reduced); colours vary a touch, like yarn.
  useLayoutEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const c = new Color();
    piece.stitches.forEach((s, i) => {
      place(m, i, s, reduceMotion ? 1 : 0.0001);
      const k = 0.9 + (((i * 9301 + 49297) % 233280) / 233280) * 0.2;
      m.setColorAt(i, c.set(s.color).multiplyScalar(k));
    });
    m.count = n;
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    clock.current = { start: performance.now(), lo: 0, done: reduceMotion };
    if (group.current) group.current.rotation.y = -0.45;
    bodyRefs.current.forEach((b) => b && ((b.material as MeshStandardMaterial).opacity = reduceMotion ? 1 : 0));
    eyeRefs.current.forEach((m, k) => m && m.scale.setScalar(reduceMotion ? piece.eyes[k].r : 0.0001));
    if (reduceMotion) onDone?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- replays when `run` changes
  }, [piece, run, reduceMotion, n]);

  useFrame((_, dt) => {
    const m = mesh.current;
    if (group.current && clock.current.done) group.current.rotation.y += dt * 0.25;
    if (!m || clock.current.done) return;
    const t = (performance.now() - clock.current.start) / 1000 / duration;
    const st = piece.stitches;
    let lo = clock.current.lo;
    let i = lo;
    for (; i < n && st[i].at <= t; i++) {
      const g = Math.min(1, (t - st[i].at) / FADE);
      const e = 1 - (1 - g) ** 3;
      place(m, i, st[i], Math.max(0.0001, e));
      if (g >= 1 && i === lo) lo++;
    }
    clock.current.lo = lo;
    m.instanceMatrix.needsUpdate = true;
    piece.bodies.forEach((b, k) => {
      const ref = bodyRefs.current[k];
      if (!ref) return;
      const span = Math.max(1e-3, b.to - b.from);
      (ref.material as MeshStandardMaterial).opacity = Math.min(1, Math.max(0, ((t - b.from) / span - 0.82) / 0.18));
    });
    // Eyes go in last, with a little pop.
    piece.eyes.forEach((e, k) => {
      const ref = eyeRefs.current[k];
      if (!ref) return;
      const g = Math.min(1, Math.max(0, (t - 0.97) / 0.06));
      ref.scale.setScalar(Math.max(0.0001, e.r * (g < 1 ? g * 1.15 : 1)));
    });
    if (t >= 1 + FADE + 0.04) {
      for (let j = lo; j < n; j++) place(m, j, st[j], 1);
      m.instanceMatrix.needsUpdate = true;
      clock.current.done = true;
      onDone?.();
    }
  });

  const k = 3.4 / piece.size;
  return (
    <group ref={group}>
      <group scale={k} position={[-piece.center[0] * k, -piece.center[1] * k, -piece.center[2] * k]}>
        {piece.bodies.map((b, i) => {
          const up = new Vector3(...b.up).normalize();
          const quat = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), up);
          return (
            <mesh key={i} ref={(el) => void (bodyRefs.current[i] = el)} geometry={bodyGeos[i]} position={b.origin} quaternion={quat}>
              <meshStandardMaterial color={new Color(b.color).multiplyScalar(0.78)} roughness={1} transparent opacity={0} side={b.open ? DoubleSide : undefined} polygonOffset polygonOffsetFactor={2} depthWrite />
            </mesh>
          );
        })}
        {piece.eyes.map((e, i) => (
          <mesh key={`eye-${i}`} ref={(el) => void (eyeRefs.current[i] = el)} position={e.p} scale={reduceMotion ? e.r : 0.0001}>
            <sphereGeometry args={[1, 20, 14]} />
            <meshStandardMaterial color="#14100E" roughness={0.18} metalness={0.1} />
          </mesh>
        ))}
        <instancedMesh ref={mesh} args={[geometry, undefined, Math.max(1, n)]} frustumCulled={false}>
          <meshStandardMaterial roughness={0.88} metalness={0} />
        </instancedMesh>
      </group>
    </group>
  );
}

export default function PieceScene({ pattern, parts, make, rowHeightCm, stitchWidthCm, run, reduceMotion, onDone }: Props) {
  const piece = useMemo(() => buildPiece(pattern, parts, make, rowHeightCm, stitchWidthCm), [pattern, parts, make, rowHeightCm, stitchWidthCm]);
  return (
    <Canvas dpr={[1, 2]} camera={{ position: [0, 0.6, 7], fov: 36 }} gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }} aria-label="3D model of the finished piece" role="img">
      <hemisphereLight args={["#fff4e6", "#5a4030", 0.75]} />
      <directionalLight position={[3.5, 6, 5]} intensity={1.6} color="#fff1df" />
      <directionalLight position={[-5, 2, -4]} intensity={0.55} color="#ffd9c0" />
      <Build piece={piece} run={run} reduceMotion={reduceMotion} onDone={onDone} />
      <ContactShadows position={[0, -1.85, 0]} opacity={0.35} scale={8} blur={2.6} far={4} />
      <OrbitControls enablePan={false} minDistance={3.5} maxDistance={13} />
    </Canvas>
  );
}
