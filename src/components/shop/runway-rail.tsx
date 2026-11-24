"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useBag } from "@/components/bag/bag-context";
import { useC } from "@/lib/i18n/collection";
import { useT } from "@/lib/i18n/client";
import { formatSar, getProduct, type Product } from "@/lib/shop/catalog";

/*
  "Try the Look", on a rail: each look's garment hangs from a wooden display rail across the top
  of the stage and the hangers glide along it (critically damped spring, K = 95). The look in front
  is full size; the others step back, smaller and softer. Autoplay every 5 s with a numbered
  progress bar, arrows and pause; drag, swipe, trackpad and arrow keys move it too.

  Clicking the front look opens "View look": the garment on the model with numbered pins linked to
  the "In this look" list. The swatches in that popup change only its colours (backdrop and accent);
  the layout and pins stay where they are.
*/

type Look = { garment: string; bag: string; pin: [number, number] };
const LOOKS: Look[] = [
  { garment: "star-bell-sleeve-sweater", bag: "cocoa-bucket-bag", pin: [55, 38] },
  { garment: "green-rose-hem-dress", bag: "cream-braided-tote", pin: [50, 50] },
  { garment: "open-weave-maxi-overlay", bag: "terracotta-crescent-bag", pin: [50, 42] },
  { garment: "daisy-vest", bag: "sage-daisy-crossbody", pin: [56, 50] },
  { garment: "flared-yellow-cardigan", bag: "cream-mesh-tote", pin: [50, 48] },
  { garment: "spiderweb-mesh-top", bag: "burgundy-pearl-clutch", pin: [50, 40] },
  { garment: "distressed-striped-sweater", bag: "navy-bow-clutch", pin: [50, 45] },
  { garment: "checkerboard-maxi-dress", bag: "wine-mini-bag", pin: [52, 58] },
];
const SPEED = 5000;
const K = 95;
const C = 2 * Math.sqrt(K);

/** Popup colourways: only the surface and accent change. */
const TINTS = [
  { id: "linen", surface: "#F3ECE1", accent: "#A44F36" },
  { id: "sage", surface: "#E6EBE1", accent: "#55664F" },
  { id: "rose", surface: "#F4E4E2", accent: "#8E3B46" },
  { id: "sand", surface: "#EFE2CC", accent: "#7A5A2E" },
  { id: "espresso", surface: "#2E2621", accent: "#E2B48A" },
];

const wrap = (d: number, n: number) => ((((d + n / 2) % n) + n) % n) - n / 2;

export function RunwayRail() {
  const { bi, locale } = useT();
  const c = useC();
  const r = c.runway;
  const reduce = useReducedMotion() ?? false;
  const looks = useMemo(
    () => LOOKS.map((l) => ({ ...l, g: getProduct(l.garment), b: getProduct(l.bag) })).filter((l): l is Look & { g: Product; b: Product } => !!l.g?.hanger && !!l.b),
    [],
  );
  const n = looks.length;

  const stage = useRef<HTMLDivElement | null>(null);
  const items = useRef<(HTMLButtonElement | null)[]>([]);
  const sim = useRef({ cur: reduce ? 0 : -1.15, vel: 0, target: 0, raf: 0, last: 0, W: 1000, H: 600 });
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(!reduce);
  const [hold, setHold] = useState(false);
  const [open, setOpen] = useState(false);
  const [tint, setTint] = useState(0);
  const [hot, setHot] = useState<number | null>(null);
  const drag = useRef<{ x: number; y: number; t: number; on: boolean; id: number; samples: { x: number; time: number }[] } | null>(null);
  const suppress = useRef(0);
  const look = looks[index];

  const paint = useCallback(() => {
    const s = sim.current;
    const cx = s.W / 2;
    const spacing = Math.max(140, s.W * (s.W < 750 ? 0.42 : 0.2));
    items.current.forEach((el, i) => {
      if (!el) return;
      const d = wrap(i - s.cur, n);
      const a = Math.abs(d);
      const scale = Math.max(0.45, 1 - 0.15 * a);
      const dir = document.documentElement.dir === "rtl" ? -1 : 1;
      const x = cx + dir * d * spacing * (1 - 0.06 * a);
      const op = a > 3.6 ? 0 : Math.min(1, 1 - Math.max(0, a - 2.6));
      const swing = Math.max(-9, Math.min(9, -s.vel * 5 * (1 + a * 0.3)));
      el.style.transform = `translate3d(${(x).toFixed(1)}px,0,0) translateX(-50%) rotate(${swing.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
      el.style.opacity = op.toFixed(3);
      el.style.zIndex = String(100 - Math.round(a * 10));
      el.style.filter = a > 0.05 ? `blur(${Math.min(5, a * 1.6).toFixed(1)}px)` : "none";
      el.style.visibility = op < 0.01 ? "hidden" : "visible";
      el.tabIndex = Math.round(a) === 0 ? 0 : -1;
    });
  }, [n]);

  const loop = useCallback(
    (now: number) => {
      const s = sim.current;
      const dt = s.last ? Math.min(0.034, (now - s.last) / 1000) : 1 / 60;
      s.last = now;
      if (!drag.current?.on) {
        const h = dt / 3;
        for (let k = 0; k < 3; k++) {
          const acc = -K * (s.cur - s.target) - C * s.vel;
          s.vel += acc * h;
          s.cur += s.vel * h;
        }
      }
      paint();
      if (drag.current?.on || Math.abs(s.cur - s.target) > 0.0005 || Math.abs(s.vel) > 0.0005) s.raf = requestAnimationFrame(loop);
      else {
        s.cur = s.target;
        s.vel = 0;
        s.raf = 0;
        s.last = 0;
        paint();
      }
    },
    [paint],
  );
  const kick = useCallback(() => {
    const s = sim.current;
    if (reduce) {
      s.cur = s.target;
      paint();
      return;
    }
    if (!s.raf) s.raf = requestAnimationFrame(loop);
  }, [loop, paint, reduce]);

  const moveTo = useCallback(
    (t: number) => {
      sim.current.target = t;
      setIndex(((t % n) + n) % n);
      setOpen(false);
      setHot(null);
      kick();
    },
    [kick, n],
  );
  const next = useCallback(() => moveTo(Math.round(sim.current.target) + 1), [moveTo]);
  const prev = useCallback(() => moveTo(Math.round(sim.current.target) - 1), [moveTo]);
  const go = (i: number) => {
    let d = (((i - index) % n) + n) % n;
    if (d > n / 2) d -= n;
    moveTo(Math.round(sim.current.target) + d);
  };

  // Measure the stage.
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      sim.current.W = el.clientWidth;
      sim.current.H = el.clientHeight;
      paint();
    });
    ro.observe(el);
    kick();
    return () => {
      ro.disconnect();
      cancelAnimationFrame(sim.current.raf);
      sim.current.raf = 0;
    };
  }, [kick, paint]);

  // Autoplay, held while the panel is hovered or the popup is open.
  useEffect(() => {
    if (!playing || hold || open || reduce) return;
    const id = window.setTimeout(next, SPEED);
    return () => clearTimeout(id);
  }, [index, playing, hold, open, reduce, next]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const onDown = (e: React.PointerEvent) => {
    if (open || (e.pointerType === "mouse" && e.button !== 0)) return;
    drag.current = { x: e.clientX, y: e.clientY, t: sim.current.target, on: false, id: e.pointerId, samples: [{ x: e.clientX, time: performance.now() }] };
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.on) {
      if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) return void (drag.current = null);
      if (Math.abs(dx) > 8 && Math.abs(dx) > 1.2 * Math.abs(dy)) {
        d.on = true;
        setPlaying(false);
        stage.current?.setPointerCapture(e.pointerId);
      } else return;
    }
    const rtl = locale === "ar" ? -1 : 1;
    const unit = Math.max(120, sim.current.W * 0.2);
    d.samples.push({ x: e.clientX, time: performance.now() });
    if (d.samples.length > 6) d.samples.shift();
    sim.current.target = d.t - (rtl * dx) / unit;
    sim.current.cur += (sim.current.target - sim.current.cur) * 0.5;
    kick();
  };
  const onUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d?.on) return;
    suppress.current = performance.now() + 60;
    const a = d.samples[0];
    const b = d.samples[d.samples.length - 1];
    const vx = (b.x - a.x) / Math.max(1, b.time - a.time);
    const from = Math.round(d.t);
    const rtl = locale === "ar" ? -1 : 1;
    let i = Math.round(sim.current.target - (rtl * vx * 160) / Math.max(120, sim.current.W * 0.2));
    if (i === from && Math.abs(vx) > 0.3) i = from + (vx * rtl > 0 ? -1 : 1);
    moveTo(Math.max(from - 2, Math.min(from + 2, i)));
  };

  const t = TINTS[tint];
  const pieces = look ? [look.g, look.b] : [];

  return (
    <div className="grid overflow-hidden rounded-sm border border-line/10 bg-[#FAF7F2] text-[#26211E] lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="relative flex min-h-[min(78svh,720px)] flex-col">
        <div className="flex items-end justify-between gap-4 px-6 pt-6 sm:px-8">
          <div>
            <h3 className="text-3xl sm:text-4xl">{r.title}</h3>
            <p className="mt-1 text-sm text-[#6B5F57]">{r.sub}</p>
          </div>
          <span className="sr-only" aria-live="polite">
            {look ? `${r.look} ${index + 1}: ${bi(look.g.title)}` : ""}
          </span>
        </div>

        {/* Stage with the rail across the top */}
        <div
          ref={stage}
          tabIndex={0}
          role="region"
          aria-roledescription="carousel"
          aria-label={r.stageLabel}
          className="relative flex-1 cursor-grab touch-pan-y select-none overflow-hidden outline-none focus-visible:shadow-[inset_0_0_0_2px_#26211E] active:cursor-grabbing"
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onWheel={(e) => {
            if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 30) {
              setPlaying(false);
              if (e.deltaX > 0) next();
              else prev();
            }
          }}
          onKeyDown={(e) => {
            const fwd = locale === "ar" ? "ArrowLeft" : "ArrowRight";
            const back = locale === "ar" ? "ArrowRight" : "ArrowLeft";
            if (e.key === fwd) (e.preventDefault(), setPlaying(false), next());
            if (e.key === back) (e.preventDefault(), setPlaying(false), prev());
          }}
        >
          {/* The rail (العليقة): a wooden rod on two wall brackets */}
          <div aria-hidden="true" className="absolute inset-x-[3%] top-[34px] z-[200] h-[10px] rounded-full" style={{ background: "linear-gradient(to bottom, #C9A47A 0%, #8A6239 45%, #6B4728 100%)", boxShadow: "0 6px 10px -4px rgba(60,30,10,0.45), inset 0 1px 0 rgba(255,235,205,0.6)" }} />
          {[0, 1].map((k) => (
            <div key={k} aria-hidden="true" className={`absolute top-[18px] z-[201] h-[34px] w-[16px] rounded-sm ${k ? "end-[3%]" : "start-[3%]"}`} style={{ background: "linear-gradient(to right, #A8A39A, #E6E2DA 45%, #8C877E)", boxShadow: "0 3px 6px rgba(0,0,0,0.25)" }} />
          ))}
          <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/3" style={{ background: "linear-gradient(to top, rgb(239 230 214 / 0.8), transparent)" }} />

          {looks.map((l, i) => (
            <button
              key={l.garment}
              ref={(el) => {
                items.current[i] = el;
              }}
              type="button"
              aria-label={`${r.look} ${i + 1}: ${bi(l.g.title)}`}
              onClick={() => {
                if (performance.now() < suppress.current) return;
                setPlaying(false);
                if (i === index) setOpen(true);
                else go(i);
              }}
              className="absolute left-0 top-[32px] origin-top will-change-transform"
              style={{ height: "calc(100% - 64px)", transition: reduce ? undefined : "filter .3s" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- local cut-out */}
              <img src={l.g.hanger} alt="" draggable={false} className="pointer-events-none h-full w-auto object-contain object-top drop-shadow-[0_26px_22px_rgba(60,30,10,0.25)]" />
            </button>
          ))}

          {/* View look: the same box every time; only its colours change with the swatches */}
          <AnimatePresence>
            {open && look && (
              <motion.div
                className="absolute inset-0 z-[300] flex items-end justify-center gap-6 px-6 pb-6 pt-16"
                style={{ backgroundColor: t.surface, transition: "background-color .6s cubic-bezier(.16,1,.3,1)" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduce ? 0 : 0.45 }}
                onClick={(e) => e.target === e.currentTarget && setOpen(false)}
                role="dialog"
                aria-label={r.viewLook}
              >
                <div className="absolute inset-x-6 top-4 flex items-center justify-between gap-4">
                  <p className={`text-sm ${tint === 4 ? "text-[#FAF7F2]" : ""}`}>
                    <span className="me-2 text-xs uppercase tracking-[0.2em] opacity-70 tabular-nums">
                      {r.look} {String(index + 1).padStart(2, "0")}
                    </span>
                    {bi(look.g.title)}
                  </p>
                  <div className="flex items-center gap-3">
                    <div role="group" aria-label={r.tint} className="flex gap-1.5">
                      {TINTS.map((x, k) => (
                        <button key={x.id} type="button" aria-pressed={k === tint} aria-label={r.tints[k]} onClick={() => setTint(k)} className={`h-7 w-7 rounded-full border-2 p-0.5 ${k === tint ? "border-current" : "border-transparent"} ${tint === 4 ? "text-[#FAF7F2]" : ""}`}>
                          <span className="block h-full w-full rounded-full ring-1 ring-black/10" style={{ background: `linear-gradient(135deg, ${x.surface} 50%, ${x.accent} 50%)` }} />
                        </button>
                      ))}
                    </div>
                    <button type="button" autoFocus onClick={() => setOpen(false)} aria-label={c.close} className="grid h-11 w-11 place-items-center rounded-full border border-black/15 bg-white/60 backdrop-blur transition-transform hover:rotate-90">
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                        <path d="M5 5l14 14M19 5L5 19" />
                      </svg>
                    </button>
                  </div>
                </div>
                {/* Model wearing the garment, pin 1 */}
                <div className="relative h-full max-h-[560px] overflow-hidden rounded-sm shadow-[0_30px_60px_-30px_rgba(0,0,0,0.5)]" style={{ aspectRatio: "680/762" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- local photo */}
                  <img src={look.g.photos[0].src} alt={bi(look.g.photos[0].alt)} className="h-full w-full object-cover" />
                  <Pin n={1} x={look.pin[0]} y={look.pin[1]} label={bi(look.g.title)} accent={t.accent} hot={hot === 0} onClick={() => setHot(0)} />
                </div>
                {/* The bag of the look, pin 2 */}
                <div className="relative hidden h-[38%] sm:block">
                  {/* eslint-disable-next-line @next/next/no-img-element -- local cut-out */}
                  <img src={look.b.cutout} alt={bi(look.b.title)} className="h-full w-auto object-contain drop-shadow-[0_20px_16px_rgba(60,30,10,0.3)]" />
                  <Pin n={2} x={50} y={55} label={bi(look.b.title)} accent={t.accent} hot={hot === 1} onClick={() => setHot(1)} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 px-4 pb-5 sm:px-8">
          <IconBtn label={r.prev} onClick={() => (setPlaying(false), prev())} path="M25 7H1M7 1L1 7l6 6" />
          <div className="flex min-w-0 flex-1 gap-1.5">
            {looks.map((l, i) => (
              <button
                key={l.garment}
                type="button"
                aria-current={i === index}
                aria-label={`${r.look} ${i + 1}: ${bi(l.g.title)}`}
                onClick={() => (setPlaying(false), go(i))}
                className={`group flex h-11 min-w-[14px] flex-col justify-center gap-2 text-start text-[10px] tabular-nums text-[#6B5F57] transition-[flex-basis] duration-700 ${i === index ? "flex-[0_0_120px] text-[#26211E] sm:flex-[0_0_170px]" : "flex-[0_1_44px]"}`}
              >
                <span className="relative block h-[2px] w-full overflow-hidden bg-[#26211E]/15">
                  <span
                    key={i === index ? `${index}-${playing && !hold && !open}` : "x"}
                    className={`absolute inset-0 origin-left bg-[#A44F36] rtl:origin-right ${i < index ? "scale-x-100 opacity-40" : i === index ? (playing && !hold && !open && !reduce ? "hero-fill" : "scale-x-100") : "scale-x-0"}`}
                    style={{ animationDuration: `${SPEED}ms` }}
                  />
                </span>
                <span className="truncate">
                  {String(i + 1).padStart(2, "0")}
                  {i === index && <>&nbsp;&nbsp;{bi(l.g.title)}</>}
                </span>
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setPlaying((p) => !p)} aria-pressed={playing} aria-label={playing ? r.pause : r.play} className="grid h-11 w-11 shrink-0 place-items-center rounded-full hover:bg-[#26211E]/5">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
              <path d={playing ? "M6.5 4.5h3.5v15H6.5zM14 4.5h3.5v15H14z" : "M7 4.5v15l12.5-7.5z"} />
            </svg>
          </button>
          <IconBtn label={r.next} onClick={() => (setPlaying(false), next())} path="M1 7h24M19 1l6 6-6 6" />
        </div>
      </div>

      {/* In this look */}
      <aside className="flex flex-col border-t border-line/10 bg-[#FAF7F2] lg:border-s lg:border-t-0" onPointerEnter={(e) => e.pointerType === "mouse" && setHold(true)} onPointerLeave={() => setHold(false)}>
        {look && <LookPanel key={look.garment} pieces={pieces} hot={hot} setHot={setHot} />}
      </aside>
    </div>
  );
}

function IconBtn({ label, onClick, path }: { label: string; onClick: () => void; path: string }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} className="grid h-11 w-11 shrink-0 place-items-center rounded-full hover:bg-[#26211E]/5">
      <svg viewBox="0 0 26 14" className="h-3.5 w-6 rtl:-scale-x-100" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={path} />
      </svg>
    </button>
  );
}

function Pin({ n, x, y, label, accent, hot, onClick }: { n: number; x: number; y: number; label: string; accent: string; hot: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-label={`${n}: ${label}`} className="group absolute -ms-[22px] -mt-[22px] grid h-11 w-11 place-items-center" style={{ left: `${x}%`, top: `${y}%` }}>
      <span
        className="grid h-6 w-6 place-items-center rounded-full text-[11px] font-semibold shadow-[0_4px_14px_-4px_rgba(0,0,0,0.35)] backdrop-blur transition-[transform,background-color,color] duration-300 group-hover:scale-125"
        style={hot ? { background: accent, color: "#fff", transform: "scale(1.3)" } : { background: "rgb(255 255 255 / 0.86)", color: "#26211E" }}
      >
        {n}
      </span>
      <span className={`pointer-events-none absolute start-[calc(100%-6px)] top-1/2 max-w-[180px] -translate-y-1/2 truncate whitespace-nowrap rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-medium text-[#26211E] shadow-lg transition-opacity ${hot ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>{label}</span>
    </button>
  );
}

function LookPanel({ pieces, hot, setHot }: { pieces: Product[]; hot: number | null; setHot: (n: number | null) => void }) {
  const { bi, locale } = useT();
  const c = useC();
  const r = c.runway;
  const { add } = useBag();
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [size, setSize] = useState<Record<string, string>>({});
  const [added, setAdded] = useState<Record<string, boolean>>({});
  const [msg, setMsg] = useState("");
  const total = pieces.reduce((s, p) => s + (p.sizes.find((x) => x.id === size[p.slug])?.price ?? p.sizes[0].price), 0);
  const addOne = (p: Product) => {
    const sz = size[p.slug];
    if (!sz) return setOpen((o) => ({ ...o, [p.slug]: true }));
    if (add({ slug: p.slug, color: p.colors[0].id, size: sz })) {
      setAdded((a) => ({ ...a, [p.slug]: true }));
      setOpen((o) => ({ ...o, [p.slug]: false }));
    }
  };
  const addAll = () => {
    setMsg("");
    const pending = pieces.filter((p) => !added[p.slug] && !size[p.slug]);
    pieces.filter((p) => !added[p.slug] && size[p.slug]).forEach(addOne);
    if (pending.length) {
      setOpen((o) => Object.fromEntries([...Object.entries(o), ...pending.map((p) => [p.slug, true])]));
      setMsg(r.pick(pending.map((p) => bi(p.title)).join(locale === "ar" ? "، " : ", ")));
    }
  };
  const complete = pieces.every((p) => added[p.slug]);

  return (
    <motion.div className="flex h-full flex-col" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <div className="flex items-baseline justify-between px-6 pb-3 pt-6 sm:px-8 lg:pt-8">
        <h4 className="text-lg">{r.inLook}</h4>
        <span className="text-[10px] uppercase tracking-[0.16em] text-[#6B5F57]">{r.pieces(pieces.length)}</span>
      </div>
      <ul className="flex-1 px-6 sm:px-8">
        {pieces.map((p, i) => (
          <li key={p.slug} onPointerEnter={(e) => e.pointerType === "mouse" && setHot(i)} onPointerLeave={() => setHot(null)} className={`relative grid grid-cols-[72px_minmax(0,1fr)_44px] items-center gap-4 border-t border-line/15 py-4 last:border-b ${hot === i ? "after:scale-x-100" : "after:scale-x-0"} after:absolute after:inset-x-0 after:-bottom-px after:h-px after:origin-left after:bg-[#A44F36] after:transition-transform after:duration-700`}>
            <span className="relative grid aspect-[4/5] place-items-center overflow-hidden bg-[#EFE6D6]">
              {/* eslint-disable-next-line @next/next/no-img-element -- local cut-out */}
              <img src={p.hanger ?? p.cutout ?? p.photos[0].src} alt="" className="max-h-[90%] max-w-[90%] object-contain" />
              <span className={`absolute end-1 top-1 grid h-5 w-5 place-items-center rounded-full text-[10px] font-semibold ${hot === i ? "bg-[#A44F36] text-white" : "bg-white/90"}`}>{i + 1}</span>
            </span>
            <span className="flex min-w-0 flex-col gap-1">
              <span className="truncate text-[10px] uppercase tracking-[0.14em] text-[#6B5F57]">{bi(p.maker)}</span>
              <a href={`/shop/${p.slug}`} className="text-sm font-medium leading-snug hover:underline">
                {bi(p.title)}
              </a>
              <span className="text-xs tabular-nums">{formatSar(p.sizes.find((x) => x.id === size[p.slug])?.price ?? p.sizes[0].price, locale)}</span>
            </span>
            <button
              type="button"
              aria-expanded={!!open[p.slug]}
              aria-label={added[p.slug] ? r.addedLabel(bi(p.title)) : r.addLabel(bi(p.title))}
              disabled={added[p.slug]}
              onClick={() => setOpen((o) => ({ ...o, [p.slug]: !o[p.slug] }))}
              className="grid h-11 w-11 place-items-center rounded-full hover:bg-[#26211E]/5"
            >
              <svg viewBox="0 0 24 24" className={`h-5 w-5 transition-transform duration-500 ${open[p.slug] ? "rotate-45" : ""}`} fill="none" stroke={added[p.slug] ? "#A44F36" : "currentColor"} strokeWidth="1.4" strokeLinecap="round" aria-hidden="true">
                <path d={added[p.slug] ? "M4.5 12.5l5 5L19.5 7" : "M12 4v16M4 12h16"} />
              </svg>
            </button>
            {open[p.slug] && !added[p.slug] && (
              <div className="col-span-3 flex flex-col gap-3 pt-2">
                <div role="radiogroup" aria-label={c.size} className="flex flex-wrap gap-2">
                  {p.sizes.map((s) => (
                    <button key={s.id} type="button" role="radio" aria-checked={size[p.slug] === s.id} onClick={() => setSize((m) => ({ ...m, [p.slug]: s.id }))} className={`min-h-10 min-w-11 rounded-full border px-3.5 text-xs transition-colors ${size[p.slug] === s.id ? "border-[#26211E] bg-[#26211E] text-white" : "border-line/30 hover:border-[#26211E]"}`}>
                      {bi(s.label)}
                    </button>
                  ))}
                </div>
                <button type="button" disabled={!size[p.slug]} onClick={() => addOne(p)} className="min-h-11 bg-[#26211E] text-xs font-medium text-white disabled:opacity-40">
                  {c.addToBag}
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-3 border-t border-line/15 px-6 pb-6 pt-4 sm:px-8">
        {msg && (
          <p role="status" className="text-xs text-[#A44F36]">
            {msg}
          </p>
        )}
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-medium">{r.complete}</span>
          <strong className="font-normal tabular-nums">{formatSar(total, locale)}</strong>
        </div>
        <button type="button" onClick={addAll} disabled={complete} className={`min-h-14 w-full text-sm font-medium text-white transition-colors ${complete ? "bg-[#55664F]" : "bg-primary hover:opacity-90"}`}>
          {complete ? r.inBag : r.addAll}
        </button>
      </div>
    </motion.div>
  );
}
