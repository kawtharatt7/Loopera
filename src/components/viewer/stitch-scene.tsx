"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useLayoutEffect, useMemo, useRef } from "react";
import { Color, InstancedMesh, MeshStandardMaterial, Object3D, Quaternion, SphereGeometry, Vector3 } from "three";
import type { EnginePart, PartPattern, Pattern } from "@/lib/engine/types";
import { tokenHex } from "@/lib/theme-colors";
import { assemblyLayout, partExtent, stitchInstances, type StitchInstance, type V3 } from "@/lib/viewer/layout";

export type ViewerMode =
  | { kind: "part"; part: PartPattern; round: number }
  | { kind: "assembly"; pattern: Pattern; parts: EnginePart[]; explode: boolean };

interface SceneProps {
  mode: ViewerMode;
  rowHeightCm: number;
  playing: boolean;
  reduceMotion: boolean;
  compact: boolean;
  onCanvas?: (canvas: HTMLCanvasElement) => void;
}

const dummy = new Object3D();
const UP = new Vector3(0, 1, 0);

function jitterColor(base: Color, i: number): Color {
  const c = base.clone();
  const k = 1 + (((i * 9301 + 49297) % 233280) / 233280 - 0.5) * 0.14;
  return c.multiplyScalar(k);
}

function setInstance(mesh: InstancedMesh, index: number, s: StitchInstance, grow: number) {
  dummy.position.set(s.pos[0], s.pos[1], s.pos[2]);
  dummy.rotation.set(s.tilt, -(s.angle + Math.PI / 2), 0, "YXZ");
  dummy.scale.set(s.width * grow, s.height * 1.25 * grow, s.height * 0.45 * grow);
  dummy.updateMatrix();
  mesh.setMatrixAt(index, dummy.matrix);
}

interface PartStitchesProps {
  part: PartPattern;
  rowHeightCm: number;
  visibleRound: number;
  highlight: boolean;
  animate: boolean;
  detail: number;
  origin?: V3;
  up?: V3;
}

function PartStitches({ part, rowHeightCm, visibleRound, highlight, animate, detail, origin = [0, 0, 0], up = [0, 1, 0] }: PartStitchesProps) {
  const done = useRef<InstancedMesh>(null);
  const current = useRef<InstancedMesh>(null);
  const currentMat = useRef<MeshStandardMaterial>(null);
  const changedAt = useRef(0);

  const instances = useMemo(() => stitchInstances(part, rowHeightCm), [part, rowHeightCm]);
  const geometry = useMemo(() => new SphereGeometry(0.5, detail, Math.max(4, detail - 3)), [detail]);
  const base = useMemo(() => new Color(part.colorHex), [part.colorHex]);
  const glow = useMemo(() => new Color(tokenHex("peach")), []);

  const doneList = useMemo(
    () => instances.filter((s) => (highlight ? s.round < visibleRound : s.round <= visibleRound)),
    [instances, visibleRound, highlight],
  );
  const currentList = useMemo(
    () => (highlight ? instances.filter((s) => s.round === visibleRound) : []),
    [instances, visibleRound, highlight],
  );

  const quaternion = useMemo(() => new Quaternion().setFromUnitVectors(UP, new Vector3(...up).normalize()), [up]);

  useLayoutEffect(() => {
    const mesh = done.current;
    if (!mesh) return;
    doneList.forEach((s, i) => {
      setInstance(mesh, i, s, 1);
      mesh.setColorAt(i, jitterColor(base, i));
    });
    mesh.count = doneList.length;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [doneList, base]);

  useLayoutEffect(() => {
    const mesh = current.current;
    if (!mesh) return;
    changedAt.current = performance.now();
    currentList.forEach((s, i) => {
      setInstance(mesh, i, s, animate ? 0.01 : 1);
      mesh.setColorAt(i, jitterColor(base, i + 7));
    });
    mesh.count = currentList.length;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    if (currentMat.current) currentMat.current.opacity = animate ? 0 : 1;
  }, [currentList, base, animate]);

  // New rounds appear with a soft scale and opacity.
  useFrame(() => {
    const mesh = current.current;
    const mat = currentMat.current;
    if (!mesh || !mat || !animate) return;
    const t = Math.min(1, (performance.now() - changedAt.current) / 380);
    if (t >= 1 && mat.opacity === 1) return;
    const e = 1 - (1 - t) ** 3;
    currentList.forEach((s, i) => setInstance(mesh, i, s, 0.4 + 0.6 * e));
    mesh.instanceMatrix.needsUpdate = true;
    mat.opacity = e;
  });

  return (
    <group position={origin} quaternion={quaternion}>
      <instancedMesh ref={done} args={[geometry, undefined, Math.max(1, instances.length)]} frustumCulled={false}>
        <meshStandardMaterial roughness={0.82} />
      </instancedMesh>
      <instancedMesh ref={current} args={[geometry, undefined, Math.max(1, instances.length)]} frustumCulled={false}>
        <meshStandardMaterial ref={currentMat} roughness={0.7} transparent emissive={glow} emissiveIntensity={0.35} />
      </instancedMesh>
    </group>
  );
}

function Rig({ mode, rowHeightCm, playing, reduceMotion, compact }: SceneProps) {
  const detail = compact ? 6 : 9;

  if (mode.kind === "part") {
    const ext = partExtent(mode.part);
    const scale = 2.6 / Math.max(ext.height, ext.radius * 2, 0.5);
    return (
      <>
        <group scale={scale} position={[0, (-ext.height / 2) * scale, 0]}>
          <PartStitches
            part={mode.part}
            rowHeightCm={rowHeightCm}
            visibleRound={mode.round}
            highlight
            animate={!reduceMotion}
            detail={detail}
          />
        </group>
        <OrbitControls enablePan={false} autoRotate={playing && !reduceMotion} autoRotateSpeed={0.8} minDistance={3} maxDistance={12} />
      </>
    );
  }

  const layout = assemblyLayout(mode.pattern, mode.parts, mode.explode ? 1.2 : 0);
  let maxDim = 1;
  let cx = 0;
  layout.forEach((l) => {
    maxDim = Math.max(maxDim, Math.abs(l.origin[0]) * 2, Math.abs(l.origin[1]) * 2, Math.abs(l.origin[2]) * 2);
    cx += l.origin[0];
  });
  mode.pattern.parts.forEach((p) => {
    const e = partExtent(p);
    maxDim = Math.max(maxDim, e.height * 1.6, e.radius * 2.4);
  });
  cx /= Math.max(1, layout.length);
  const scale = 3.6 / maxDim;
  const byId = new Map(mode.pattern.parts.map((p) => [p.partId, p]));

  return (
    <>
      <group scale={scale} position={[-cx * scale, 0, 0]}>
        {layout.map((l) => {
          const part = byId.get(l.partId);
          if (!part || part.kind !== "revolution") return null;
          return (
            <PartStitches
              key={`${l.partId}-${l.copy}`}
              part={part}
              rowHeightCm={rowHeightCm}
              visibleRound={part.rounds.length - 1}
              highlight={false}
              animate={false}
              detail={detail}
              origin={l.origin}
              up={l.up}
            />
          );
        })}
      </group>
      <OrbitControls enablePan={false} autoRotate={!reduceMotion} autoRotateSpeed={0.5} minDistance={3} maxDistance={14} />
    </>
  );
}

export default function StitchScene(props: SceneProps) {
  const key = useMemo(() => tokenHex("rose"), []);
  const rim = useMemo(() => tokenHex("ember"), []);
  return (
    <Canvas
      dpr={[1, props.compact ? 1.5 : 2]}
      camera={{ position: [0, 1.2, 6.5], fov: 38 }}
      gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
      onCreated={({ gl }) => props.onCanvas?.(gl.domElement)}
      aria-label="3D preview of the crochet piece"
      role="img"
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[4, 6, 5]} intensity={1.5} color={key} />
      <directionalLight position={[-5, -2, -4]} intensity={0.8} color={rim} />
      <Rig {...props} />
    </Canvas>
  );
}
