"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useBag } from "@/components/bag/bag-context";
import { useC } from "@/lib/i18n/collection";
import { useT } from "@/lib/i18n/client";
import { formatSar, getProduct, type Product } from "@/lib/shop/catalog";
import { ProductDialog } from "./bags-grid";

/*
  "Try the Look", on a rail: each look's garment hangs from a wooden display rail across the top
  of the stage and the hangers glide along it (critically damped spring, K = 95). The look in front
  is full size; the others step back, smaller and softer. Autoplay every 5 s with a numbered
  progress bar, arrows and pause; drag, swipe, trackpad and arrow keys move it too.

  Clicking the front look opens "View look": the garment on the model with numbered pins linked to
  the "In this look" list. The swatches in that popup change only its colours (backdrop and accent);
  the layout and pins stay where they are.
*/

type Look = { garment: string; pin: [number, number] };
const LOOKS: Look[] = [
  { garment: "star-bell-sleeve-sweater", pin: [55, 38] },
  { garment: "green-rose-hem-dress", pin: [50, 50] },
  { garment: "open-weave-maxi-overlay", pin: [50, 42] },
  { garment: "daisy-vest", pin: [56, 50] },
  { garment: "flared-yellow-cardigan", pin: [50, 48] },
  { garment: "spiderweb-mesh-top", pin: [50, 40] },
  { garment: "distressed-striped-sweater", pin: [50, 45] },
  { garment: "checkerboard-maxi-dress", pin: [52, 58] },
];
const SPEED = 5000;
const K = 95;
const C = 2 * Math.sqrt(K);

const wrap = (d: number, n: number) => ((((d + n / 2) % n) + n) % n) - n / 2;

export function RunwayRail() {
  const { bi, locale } = useT();
  const c = useC();
  const r = c.runway;
  const reduce = useReducedMotion() ?? false;
  const looks = useMemo(
    () => LOOKS.map((l) => ({ ...l, g: getProduct(l.garment) })).filter((l): l is Look & { g: Product } => !!l.g?.hanger),
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
  const colorId = "as-shown";
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


  return (
    <div className="isolate grid overflow-hidden rounded-sm border border-line/10 bg-bg text-fg lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="relative flex min-h-[min(78svh,720px)] flex-col">
        <div className="flex items-end justify-between gap-4 px-6 pt-6 sm:px-8">
          <div>
            <h3 className="text-3xl sm:text-4xl">{r.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{r.sub}</p>
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
          className="relative flex-1 cursor-grab touch-pan-y select-none overflow-hidden outline-none focus-visible:shadow-[inset_0_0_0_2px_rgb(var(--fg))] active:cursor-grabbing"
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
          <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/3" style={{ background: "linear-gradient(to top, rgb(var(--surface) / 0.8), transparent)" }} />

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
                className={`group flex h-11 min-w-[14px] flex-col justify-center gap-2 text-start text-[10px] tabular-nums text-muted-foreground transition-[flex-basis] duration-700 ${i === index ? "flex-[0_0_120px] text-fg sm:flex-[0_0_170px]" : "flex-[0_1_44px]"}`}
              >
                <span className="relative block h-[2px] w-full overflow-hidden bg-fg/15">
                  <span
                    key={i === index ? `${index}-${playing && !hold && !open}` : "x"}
                    className={`absolute inset-0 origin-left bg-primary rtl:origin-right ${i < index ? "scale-x-100 opacity-40" : i === index ? (playing && !hold && !open && !reduce ? "hero-fill" : "scale-x-100") : "scale-x-0"}`}
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
          <button type="button" onClick={() => setPlaying((p) => !p)} aria-pressed={playing} aria-label={playing ? r.pause : r.play} className="grid h-11 w-11 shrink-0 place-items-center rounded-full hover:bg-fg/5">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
              <path d={playing ? "M6.5 4.5h3.5v15H6.5zM14 4.5h3.5v15H14z" : "M7 4.5v15l12.5-7.5z"} />
            </svg>
          </button>
          <IconBtn label={r.next} onClick={() => (setPlaying(false), next())} path="M1 7h24M19 1l6 6-6 6" />
        </div>
      </div>

      {open && look && <ProductDialog key={look.garment} product={look.g} onClose={() => setOpen(false)} />}

      {/* In this look */}
      <aside className="flex flex-col border-t border-line/10 bg-bg lg:border-s lg:border-t-0" onPointerEnter={(e) => e.pointerType === "mouse" && setHold(true)} onPointerLeave={() => setHold(false)}>
        {look && <LookPanel key={look.garment} product={look.g} colorId={colorId} hot={hot} setHot={setHot} />}
      </aside>
    </div>
  );
}

function IconBtn({ label, onClick, path }: { label: string; onClick: () => void; path: string }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} className="grid h-11 w-11 shrink-0 place-items-center rounded-full hover:bg-fg/5">
      <svg viewBox="0 0 26 14" className="h-3.5 w-6 rtl:-scale-x-100" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={path} />
      </svg>
    </button>
  );
}

function Pin({ n, x, y, label, hot, onClick }: { n: number; x: number; y: number; label: string; hot: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-label={`${n}: ${label}`} className="group absolute -ms-[22px] -mt-[22px] grid h-11 w-11 place-items-center" style={{ left: `${x}%`, top: `${y}%` }}>
      <span
        className="grid h-6 w-6 place-items-center rounded-full text-[11px] font-semibold shadow-[0_4px_14px_-4px_rgba(0,0,0,0.35)] backdrop-blur transition-[transform,background-color,color] duration-300 group-hover:scale-125"
        style={hot ? { background: "#A44F36", color: "#fff", transform: "scale(1.3)" } : { background: "rgb(255 255 255 / 0.86)", color: "#26211E" }}
      >
        {n}
      </span>
      <span className={`pointer-events-none absolute start-[calc(100%-6px)] top-1/2 max-w-[180px] -translate-y-1/2 truncate whitespace-nowrap rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-medium text-fg shadow-lg transition-opacity ${hot ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>{label}</span>
    </button>
  );
}

function LookPanel({ product: p, colorId, hot, setHot }: { product: Product; colorId: string; hot: number | null; setHot: (n: number | null) => void }) {
  const { bi, locale } = useT();
  const c = useC();
  const r = c.runway;
  const { add } = useBag();
  const [size, setSize] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const [msg, setMsg] = useState("");
  useEffect(() => setAdded(false), [colorId, size]);
  const color = p.colors.find((x) => x.id === colorId) ?? p.colors[0];
  const price = p.sizes.find((x) => x.id === size)?.price ?? p.sizes[0].price;
  const addIt = () => {
    if (!size) return setMsg(r.pick(bi(p.title)));
    setMsg("");
    if (add({ slug: p.slug, color: colorId, size })) setAdded(true);
  };

  return (
    <motion.div className="flex h-full flex-col" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <div className="flex flex-col gap-1 px-6 pb-3 pt-6 sm:px-8 lg:pt-8">
        <h4 className="text-lg">{r.inLook}</h4>
        <span className="text-xs text-muted-foreground">{c.readyIn(p.leadTimeDays)}</span>
      </div>
      <div className="flex-1 px-6 sm:px-8" onPointerEnter={(e) => e.pointerType === "mouse" && setHot(0)} onPointerLeave={() => setHot(null)}>
        <div className="grid grid-cols-[84px_minmax(0,1fr)] items-center gap-4 border-y border-line/15 py-4">
          <span className="relative grid aspect-[4/5] place-items-center overflow-hidden rounded-sm bg-surface">
            {/* eslint-disable-next-line @next/next/no-img-element -- local cut-out */}
            <img src={p.hanger ?? p.photos[0].src} alt="" className="max-h-[90%] max-w-[90%] object-contain" />
            <span className={`absolute end-1 top-1 grid h-5 w-5 place-items-center rounded-full text-[10px] font-semibold ${hot === 0 ? "bg-primary text-primary-fg" : "bg-bg/90"}`}>1</span>
          </span>
          <span className="flex min-w-0 flex-col gap-1">
            <span className="truncate text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{bi(color.name)}</span>
            <a href={`/shop/${p.slug}`} className="text-base font-medium leading-snug hover:underline">
              {bi(p.title)}
            </a>
            <span className="text-sm tabular-nums">{formatSar(price, locale)}</span>
          </span>
        </div>
        <div role="radiogroup" aria-label={c.size} className="mt-5 flex flex-wrap gap-2">
          {p.sizes.map((s) => (
            <button key={s.id} type="button" role="radio" aria-checked={size === s.id} onClick={() => setSize(s.id)} className={`min-h-10 min-w-12 rounded-full border px-4 text-xs transition-colors duration-300 ${size === s.id ? "border-fg bg-fg text-bg" : "border-line/25 hover:border-fg"}`}>
              {bi(s.label)}
            </button>
          ))}
        </div>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{bi(p.description)}</p>
      </div>
      <div className="flex flex-col gap-3 px-6 pb-6 pt-4 sm:px-8">
        {msg && (
          <p role="status" className="text-xs text-terracotta">
            {msg}
          </p>
        )}
        <button type="button" onClick={addIt} className={`min-h-14 w-full rounded-full text-sm font-medium transition-colors duration-500 ${added ? "bg-sage text-white" : "bg-fg text-bg hover:opacity-90"}`}>
          {added ? c.added : c.addToBag}
        </button>
      </div>
    </motion.div>
  );
}
