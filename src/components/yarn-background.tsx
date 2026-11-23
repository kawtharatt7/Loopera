"use client";

import { useEffect, useRef } from "react";

/*
  The page background: a few strands of plied yarn drifting slowly across the edges of the
  screen, over a faint knitted-fabric texture (CSS). Drawn on one fixed canvas; capped at
  30 fps, paused when the tab is hidden, and still under reduced motion.
*/

interface Strand {
  y: number; // 0–1 of the height where the strand crosses
  amp: number; // wave height, 0–1 of the height
  freq: number; // waves across the screen
  speed: number;
  phase: number;
  width: number; // px
  color: [number, number, number];
  tilt: number; // slope across the screen
}

const STRANDS: Strand[] = [
  { y: 0.035, amp: 0.025, freq: 1.3, speed: 0.11, phase: 0, width: 13, color: [142, 21, 35], tilt: 0.02 },
  { y: 0.075, amp: 0.025, freq: 1.7, speed: -0.08, phase: 2, width: 9, color: [226, 155, 106], tilt: -0.02 },
  { y: 0.95, amp: 0.025, freq: 1.1, speed: 0.07, phase: 4, width: 14, color: [243, 182, 182], tilt: -0.02 },
  { y: 0.985, amp: 0.015, freq: 2.1, speed: -0.1, phase: 1, width: 8, color: [206, 79, 47], tilt: 0.01 },
];

function drawStrand(ctx: CanvasRenderingContext2D, s: Strand, w: number, h: number, t: number, alpha: number) {
  const pts: [number, number][] = [];
  const step = 6;
  for (let x = -40; x <= w + 40; x += step) {
    const u = x / w;
    const y = (s.y + s.tilt * (u - 0.5)) * h + Math.sin(u * Math.PI * 2 * s.freq + s.phase + t * s.speed) * s.amp * h + Math.sin(u * 9 + t * s.speed * 1.7) * 3;
    pts.push([x, y]);
  }
  const [r, g, b] = s.color;
  const line = (width: number, style: string, dy = 0) => {
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y + dy) : ctx.moveTo(x, y + dy)));
    ctx.lineWidth = width;
    ctx.strokeStyle = style;
    ctx.stroke();
  };
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  // body, then a soft shadow side and a light side, so the strand looks round
  line(s.width + 2, `rgba(0,0,0,${0.35 * alpha})`, 2);
  line(s.width, `rgba(${r},${g},${b},${alpha})`);
  line(s.width * 0.35, `rgba(255,255,255,${0.12 * alpha})`, -s.width * 0.22);
  // the twist of the plies: short slanted marks along the strand
  ctx.lineWidth = Math.max(1, s.width * 0.16);
  ctx.strokeStyle = `rgba(${Math.max(0, r - 60)},${Math.max(0, g - 60)},${Math.max(0, b - 60)},${0.55 * alpha})`;
  const half = s.width / 2;
  const spacing = Math.max(5, s.width * 0.55);
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const seg = Math.hypot(x1 - x0, y1 - y0);
    acc += seg;
    if (acc < spacing) continue;
    acc = 0;
    const tx = (x1 - x0) / seg;
    const ty = (y1 - y0) / seg;
    const nx = -ty;
    const ny = tx;
    ctx.beginPath();
    ctx.moveTo(x1 - nx * half * 0.9 - tx * half * 0.5, y1 - ny * half * 0.9 - ty * half * 0.5);
    ctx.lineTo(x1 + nx * half * 0.9 + tx * half * 0.5, y1 + ny * half * 0.9 + ty * half * 0.5);
    ctx.stroke();
  }
}

export function YarnBackground() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let last = 0;
    let w = 0;
    let h = 0;
    const size = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = innerWidth;
      h = innerHeight;
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const paint = (now: number) => {
      const light = document.documentElement.getAttribute("data-theme") === "light";
      ctx.clearRect(0, 0, w, h);
      const t = now / 1000;
      STRANDS.forEach((s) => drawStrand(ctx, s, w, h, t, light ? 0.5 : 0.55));
    };
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (now - last < 33) return;
      last = now;
      paint(now);
    };
    const vis = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden && !calm) raf = requestAnimationFrame(frame);
    };
    size();
    paint(0);
    addEventListener("resize", size);
    document.addEventListener("visibilitychange", vis);
    window.addEventListener("loopera-theme", () => paint(performance.now()));
    vis();
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("resize", size);
      document.removeEventListener("visibilitychange", vis);
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none fixed inset-0 -z-[1] h-full w-full" />;
}
