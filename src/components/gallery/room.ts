// The curved gallery passage, in plain three.js. Units are metres and the ring's centre is the
// origin. Hangings are on both walls; only the camera moves.
import * as THREE from "three";

export const R = 18; // outer wall radius
export const RIN = 12.2; // inner wall radius
export const H = 6.2; // wall height
export const PW = 1.36; // hanging width
export const PY = 1.95; // hanging centre height
export const OUTER_SLOTS = 36;
export const INNER_SLOTS = 24;
export const STEP = (Math.PI * 2) / OUTER_SLOTS;

export interface Pose {
  th: number;
  r: number;
  yaw: number;
  y: number;
  pitch: number;
}

export interface Slot {
  wall: "outer" | "inner";
  angle: number;
  index: number; // which piece (0..n-1)
  mesh: THREE.Mesh; // the hanging plane, used for picking
  height: number;
}

export interface RoomColors {
  wallTop: string;
  wallMid: string;
  wallBottom: string;
  floorIn: string;
  floorOut: string;
  ceiling: string;
  fog: string;
  ink: string;
}

function gradientTexture(stops: [number, string][], h = 256): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 4;
  c.height = h;
  const ctx = c.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 0, h);
  stops.forEach(([o, col]) => g.addColorStop(o, col));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 4, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function radialTexture(inner: string, outer: string, from = 0, size = 256): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, size * from, size / 2, size / 2, size / 2);
  g.addColorStop(0, inner);
  g.addColorStop(1, outer);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Label under a hanging: maker and title, written in the visitor's language. */
function labelTexture(maker: string, title: string, meta: string, ink: string, rtl: boolean): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 640;
  c.height = 260;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = ink;
  ctx.direction = rtl ? "rtl" : "ltr";
  ctx.textAlign = rtl ? "right" : "left";
  const x = rtl ? 610 : 30;
  ctx.font = '600 54px "IBM Plex Sans Arabic", Tahoma, sans-serif';
  ctx.fillText(maker, x, 78);
  ctx.font = '700 50px "Alexandria", Tahoma, sans-serif';
  ctx.fillText(title, x, 150);
  ctx.globalAlpha = 0.7;
  ctx.font = '500 30px "IBM Plex Sans Arabic", Tahoma, sans-serif';
  ctx.fillText(meta, x, 212);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export interface Piece {
  image: HTMLCanvasElement; // the drawn hanging (transparent background)
  maker: string;
  title: string;
  meta: string;
}

export function buildRoom(scene: THREE.Scene, colors: RoomColors, pieces: Piece[], rtl: boolean, maxAniso: number): { slots: Slot[]; dispose: () => void } {
  const disposables: { dispose: () => void }[] = [];
  const keep = <T extends { dispose: () => void }>(x: T) => {
    disposables.push(x);
    return x;
  };

  scene.background = new THREE.Color(colors.fog);
  scene.fog = new THREE.Fog(colors.fog, 10, 46);

  const outerTex = keep(gradientTexture([[0, colors.wallTop], [0.2, colors.wallMid], [0.6, colors.wallMid], [0.86, colors.wallBottom], [1, colors.wallBottom]]));
  const outer = new THREE.Mesh(keep(new THREE.CylinderGeometry(R, R, H, 160, 1, true)), keep(new THREE.MeshBasicMaterial({ map: outerTex, side: THREE.BackSide })));
  outer.position.y = H / 2;
  scene.add(outer);

  const innerTex = keep(gradientTexture([[0, colors.wallTop], [0.3, colors.wallMid], [0.8, colors.wallMid], [1, colors.wallBottom]]));
  const inner = new THREE.Mesh(keep(new THREE.CylinderGeometry(RIN, RIN, H, 120, 1, true)), keep(new THREE.MeshBasicMaterial({ map: innerTex, side: THREE.FrontSide })));
  inner.position.y = H / 2;
  scene.add(inner);

  const floorTex = keep(radialTexture(colors.floorIn, colors.floorOut, RIN / R));
  const floor = new THREE.Mesh(keep(new THREE.CircleGeometry(R, 160)), keep(new THREE.MeshBasicMaterial({ map: floorTex })));
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  const ceiling = new THREE.Mesh(keep(new THREE.CircleGeometry(R, 160)), keep(new THREE.MeshBasicMaterial({ color: colors.ceiling, side: THREE.BackSide })));
  ceiling.rotation.x = -Math.PI / 2;
  ceiling.position.y = H;
  scene.add(ceiling);

  const haloTex = keep(radialTexture("rgba(255,255,255,0.5)", "rgba(255,255,255,0)", 0.2));
  const shadowTex = keep(radialTexture("rgba(30,10,10,0.35)", "rgba(30,10,10,0)", 0.1));

  // One texture and label per piece, shared by every copy on the walls.
  const pieceTex = pieces.map((p) => {
    const t = keep(new THREE.CanvasTexture(p.image));
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = maxAniso;
    return t;
  });
  const labels = pieces.map((p) => keep(labelTexture(p.maker, p.title, p.meta, colors.ink, rtl)));
  const pieceGeo = pieces.map((p) => keep(new THREE.PlaneGeometry(PW, (PW * p.image.height) / p.image.width)));
  const labelGeo = keep(new THREE.PlaneGeometry(0.92, (0.92 * 260) / 640));

  const slots: Slot[] = [];
  const addGroup = (angle: number, radius: number, wall: Slot["wall"], index: number) => {
    const g = new THREE.Group();
    g.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
    if (wall === "outer") g.lookAt(0, 0, 0);
    else g.lookAt(g.position.x * 2, 0, g.position.z * 2);
    const ph = (PW * pieces[index].image.height) / pieces[index].image.width;
    const top = PY + ph / 2;

    const halo = new THREE.Mesh(keep(new THREE.PlaneGeometry(PW * 2.1, ph * 1.6)), keep(new THREE.MeshBasicMaterial({ map: haloTex, transparent: true, depthWrite: false })));
    halo.position.set(0, PY + 0.05, 0.005);
    g.add(halo);
    const shadow = new THREE.Mesh(keep(new THREE.PlaneGeometry(PW * 1.2, ph * 1.12)), keep(new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })));
    shadow.position.set(0.06, PY - 0.08, 0.01);
    g.add(shadow);
    const plane = new THREE.Mesh(pieceGeo[index], keep(new THREE.MeshBasicMaterial({ map: pieceTex[index], transparent: true })));
    plane.position.set(0, PY, 0.04);
    g.add(plane);
    const label = new THREE.Mesh(labelGeo, keep(new THREE.MeshBasicMaterial({ map: labels[index], transparent: true, depthWrite: false })));
    label.position.set(rtl ? PW / 2 - 0.46 : -PW / 2 + 0.46, top - ph - 0.38, 0.02);
    g.add(label);
    scene.add(g);
    slots.push({ wall, angle, index, mesh: plane, height: ph });
  };

  const n = pieces.length;
  for (let s = 0; s < OUTER_SLOTS; s++) addGroup(s * STEP, R - 0.02, "outer", s % n);
  for (let k = 0; k < INNER_SLOTS; k++) addGroup(((k + 0.5) * Math.PI * 2) / INNER_SLOTS, RIN + 0.02, "inner", (k + 4) % n);

  return { slots, dispose: () => disposables.forEach((d) => d.dispose()) };
}

/** Camera from a pose: on the ring at angle th, looking along the passage turned by yaw. */
export function applyPose(cam: THREE.PerspectiveCamera, p: Pose) {
  const tx = Math.sin(p.th);
  const tz = -Math.cos(p.th);
  const nx = Math.cos(p.th);
  const nz = Math.sin(p.th);
  const x = p.r * nx;
  const z = p.r * nz;
  cam.position.set(x, p.y, z);
  const dx = Math.cos(p.yaw) * tx + Math.sin(p.yaw) * nx;
  const dz = Math.cos(p.yaw) * tz + Math.sin(p.yaw) * nz;
  cam.lookAt(x + dx, p.y + p.pitch, z + dz);
}

export const easeQuart = (t: number) => 1 - (1 - t) ** 4;
export const easeQuad = (t: number) => 1 - (1 - t) ** 2;
export const easeCubic = (t: number) => 1 - (1 - t) ** 3;
export const easeExpo = (t: number) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t));

export function lerpPose(a: Pose, b: Pose, t: number, intro = false): Pose {
  const e = intro ? easeExpo(t) : null;
  const th = a.th + (b.th - a.th) * (e ?? easeQuart(t));
  const yaw = a.yaw + (b.yaw - a.yaw) * (e ?? easeQuad(t));
  const c = e ?? easeCubic(t);
  return { th, yaw, r: a.r + (b.r - a.r) * c, y: a.y + (b.y - a.y) * c, pitch: a.pitch + (b.pitch - a.pitch) * c };
}

/** The copy of `angle` within ±π of `near`, so the camera always goes the short way round. */
export function nearestAngle(angle: number, near: number): number {
  let a = angle;
  while (a - near > Math.PI) a -= Math.PI * 2;
  while (a - near < -Math.PI) a += Math.PI * 2;
  return a;
}
