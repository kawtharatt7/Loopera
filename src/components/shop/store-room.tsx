"use client";

import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { SiteHeader } from "@/components/layout/site-header";
import { useC } from "@/lib/i18n/collection";
import { useT } from "@/lib/i18n/client";
import { byCategory, formatSar, fromPrice, type Product } from "@/lib/shop/catalog";
import { ProductDialog } from "./bags-grid";
import { ClothesLooks } from "./clothes-looks";
import { Gifts } from "./gifts";
import { HangerView } from "./hanger-view";
import { WallHub } from "./wall-hub";

/*
  The store as one square room. The camera stands in the middle; each section is a wall:
  clothing in front, bags to the right, wall hangings behind, dolls and bouquets to the left.
  Turning (tabs, drag or swipe, arrow keys) rotates the room around the viewer on a soft spring,
  and the pointer leans the view a few degrees, so it feels like looking around a real space.
  The walls are W×H planes at distance W/2 from the eye (perspective W/2), so the wall in front
  fills the screen exactly; gaps at the corners mid-turn show the ceiling and the wooden floor.
*/

const WALLS = ["clothes", "bags", "wall", "dolls"] as const;
type WallId = (typeof WALLS)[number];
const mod = (n: number, m: number) => ((n % m) + m) % m;

/** Hanger photos: natural width, height, and the width of the wooden hanger, so all hangers hang at one size. */
const HANG: Record<string, [w: number, h: number, hanger: number]> = {
  "checkerboard-maxi-dress": [314, 708, 160],
  "daisy-vest": [474, 636, 178],
  "distressed-striped-sweater": [570, 686, 191],
  "flared-yellow-cardigan": [620, 662, 196],
  "green-rose-hem-dress": [380, 676, 172],
  "open-weave-maxi-overlay": [432, 692, 165],
  "spiderweb-mesh-top": [516, 682, 200],
  "star-bell-sleeve-sweater": [650, 656, 185],
};

export function StoreRoom() {
  const c = useC();
  const r = c.room;
  const stage = useRef<HTMLDivElement | null>(null);
  const [box, setBox] = useState({ w: 1280, h: 720 });
  const [face, setFace] = useState(0);
  const [touched, setTouched] = useState(false);

  const clothes = useMemo(() => byCategory("clothes"), []);
  const onHanger = useMemo(() => clothes.filter((p) => p.hanger), [clothes]);
  const bags = useMemo(() => byCategory("bags"), []);
  const wall = useMemo(() => byCategory("wall"), []);
  const dolls = useMemo(() => byCategory("dolls"), []);
  const flowers = useMemo(() => byCategory("flowers"), []);

  const [piece, setPiece] = useState<number | null>(null);
  const [bag, setBag] = useState<Product | null>(null);
  const [sheet, setSheet] = useState<"looks" | "wall" | "gifts" | null>(null);

  // Camera: the turn (deg) on a spring, plus a small lean toward the pointer.
  const angle = useMotionValue(0);
  const turn = useSpring(angle, { stiffness: 55, damping: 18, mass: 1 });
  const leanX = useMotionValue(0);
  const leanY = useMotionValue(0);
  const lx = useSpring(leanX, { stiffness: 40, damping: 16 });
  const ly = useSpring(leanY, { stiffness: 40, damping: 16 });
  const radius = useMotionValue(640);

  useLayoutEffect(() => {
    const el = stage.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setBox({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => radius.set(box.w / 2), [box.w, radius]);
  useEffect(() => angle.on("change", (a) => setFace(mod(Math.round(a / 90), 4))), [angle]);

  const go = useCallback(
    (i: number) => {
      const a = angle.get();
      const base = Math.round(a / 90);
      let d = mod(i - mod(base, 4), 4);
      if (d === 3) d = -1;
      angle.set((base + d) * 90);
      setTouched(true);
    },
    [angle],
  );
  const step = useCallback((d: number) => go(mod(face + d, 4)), [face, go]);

  const open = piece !== null || bag !== null || sheet !== null;

  // Arrow keys turn the room when nothing is open on top of it.
  useEffect(() => {
    if (open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, step]);

  // Drag or swipe to turn; a short flick moves one wall. Clicks still reach the pieces.
  const drag = useRef<{ x: number; y: number; a: number; t: number; on: boolean; id: number } | null>(null);
  const moved = useRef(false);
  const onDown = (e: React.PointerEvent) => {
    if (open || e.button !== 0 || (e.target as HTMLElement).closest("[data-noturn]")) return;
    drag.current = { x: e.clientX, y: e.clientY, a: angle.get(), t: performance.now(), on: false, id: e.pointerId };
    moved.current = false;
  };
  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && !open) {
      leanX.set(((e.clientX - box.w / 2) / box.w) * 7);
      leanY.set(-((e.clientY - box.h / 2) / box.h) * 3);
    }
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    if (!d.on) {
      if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(e.clientY - d.y)) return;
      d.on = true;
      moved.current = true;
      stage.current?.setPointerCapture(d.id);
    }
    angle.set(d.a - (dx / box.w) * 110);
  };
  const onUp = (e: React.PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (!d?.on) return;
    const dx = e.clientX - d.x;
    const v = dx / Math.max(1, performance.now() - d.t);
    const base = d.a / 90;
    const a = angle.get() / 90;
    let target = Math.round(a);
    if (Math.abs(v) > 0.35 && target === Math.round(base)) target = Math.round(base) + (v < 0 ? 1 : -1);
    angle.set(target * 90);
    setTouched(true);
  };
  const onLeave = () => {
    leanX.set(0);
    leanY.set(0);
  };

  const R = box.w / 2;
  const wallFace = (i: number): ReactNode => {
    const id = WALLS[i];
    if (id === "clothes") return <ClothesWall items={onHanger} h={box.h} w={box.w} onPick={setPiece} onLooks={() => setSheet("looks")} />;
    if (id === "bags") return <BagsWall items={bags} onPick={setBag} />;
    if (id === "wall") return <HangingsWall items={wall} onBrowse={() => setSheet("wall")} />;
    return <ShelfWall items={[...dolls, ...flowers]} onPick={() => setSheet("gifts")} />;
  };

  return (
    <>
      <SiteHeader compact />
      <main id="main" className="fixed inset-x-0 bottom-0 top-16 overflow-hidden" aria-label={r.label}>
        <h1 className="sr-only">{r.label}</h1>
        <div
          ref={stage}
          className="room-stage absolute inset-0 touch-pan-y select-none"
          style={{ perspective: `${R}px` }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onPointerLeave={onLeave}
          onClickCapture={(e) => {
            if (moved.current) {
              e.stopPropagation();
              e.preventDefault();
              moved.current = false;
            }
          }}
        >
          {WALLS.map((id, i) => (
            <Wall key={id} i={i} label={r.walls[id]} current={face === i} turn={turn} lx={lx} ly={ly} radius={radius}>
              {wallFace(i)}
            </Wall>
          ))}

          {/* turn buttons at the edges */}
          <button type="button" onClick={() => step(-1)} aria-label={r.left} className="absolute left-2 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-bg/50 text-fg/70 backdrop-blur transition-colors hover:bg-bg/80 hover:text-fg sm:flex">
            <svg aria-hidden="true" viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 3L5 8l5 5" />
            </svg>
          </button>
          <button type="button" onClick={() => step(1)} aria-label={r.right} className="absolute right-2 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-bg/50 text-fg/70 backdrop-blur transition-colors hover:bg-bg/80 hover:text-fg sm:flex">
            <svg aria-hidden="true" viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 3l5 5-5 5" />
            </svg>
          </button>
        </div>

        {/* the sections, as tabs at the bottom of the room */}
        <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex flex-col items-center gap-2 px-3">
          <AnimatePresence>
            {!touched && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="rounded-full bg-bg/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
                {r.hint}
              </motion.p>
            )}
          </AnimatePresence>
          <nav aria-label={r.label} className="pointer-events-auto max-w-full overflow-x-auto rounded-full bg-bg/75 p-1 shadow-[0_18px_40px_-20px_rgba(30,15,5,0.55)] ring-1 ring-line/10 backdrop-blur-md [scrollbar-width:none]">
            <ul className="flex" role="tablist">
              {WALLS.map((id, i) => (
                <li key={id}>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={face === i}
                    onClick={() => go(i)}
                    className={`relative inline-flex min-h-11 items-center whitespace-nowrap rounded-full px-2.5 text-[13px] transition-colors duration-500 sm:px-5 sm:text-sm ${face === i ? "text-bg" : "text-fg/75 hover:text-fg"}`}
                  >
                    {face === i && <motion.span layoutId="room-tab" className="absolute inset-0 rounded-full bg-fg" transition={{ type: "spring", stiffness: 260, damping: 30 }} />}
                    <span className="relative">{r.walls[id]}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </main>

      <AnimatePresence>{piece !== null && <HangerView products={onHanger} index={piece} onIndex={setPiece} onClose={() => setPiece(null)} />}</AnimatePresence>
      {bag && <ProductDialog product={bag} onClose={() => setBag(null)} />}
      <AnimatePresence>
        {sheet && (
          <Sheet title={sheet === "looks" ? r.walls.clothes : sheet === "wall" ? c.hub.title : c.gifts.title} sub={sheet === "wall" ? c.hub.sub : sheet === "gifts" ? c.gifts.sub : c.clothes.sub} onClose={() => setSheet(null)}>
            {sheet === "looks" && <ClothesLooks products={clothes} />}
            {sheet === "wall" && <WallHub products={wall} />}
            {sheet === "gifts" && <Gifts dolls={dolls} bouquets={flowers} />}
          </Sheet>
        )}
      </AnimatePresence>
    </>
  );
}

type MV = ReturnType<typeof useMotionValue<number>>;

/**
 * One wall. The whole camera lives in its transform (turn around the viewer, then step back to the
 * wall), so no element sits on the eye plane and every wall stays clickable.
 */
function Wall({ i, label, current, turn, lx, ly, radius, children }: { i: number; label: string; current: boolean; turn: MV; lx: MV; ly: MV; radius: MV; children: ReactNode }) {
  const transform = useTransform(() => {
    const R = radius.get();
    return `translateZ(${R}px) rotateX(${ly.get()}deg) rotateY(${turn.get() + lx.get() - i * 90}deg) translateZ(${-R}px)`;
  });
  return (
    <motion.section
      aria-label={label}
      aria-hidden={!current}
      inert={!current}
      className="room-wall absolute inset-0 overflow-hidden"
      style={{ transform, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
    >
      <span aria-hidden="true" className="room-light" />
      <span aria-hidden="true" className="room-skirting" />
      {children}
    </motion.section>
  );
}

/** A full page over the room (the gallery, the looks, the gifts), with a way back. */
function Sheet({ title, sub, onClose, children }: { title: string; sub?: string; onClose: () => void; children: ReactNode }) {
  const c = useC();
  const ref = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !document.querySelector("[role=dialog][aria-modal=true]:not([data-sheet])") && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      data-sheet
      aria-label={title}
      className="fixed inset-x-0 bottom-0 top-16 z-40 overflow-y-auto bg-bg"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="mx-auto max-w-7xl px-5 pb-20 pt-6 sm:px-8">
        <button ref={ref} type="button" onClick={onClose} className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm text-fg/80 transition-colors hover:bg-surface hover:text-fg">
          <svg aria-hidden="true" viewBox="0 0 16 16" className="h-4 w-4 rtl:-scale-x-100" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 3L5 8l5 5" />
          </svg>
          {c.room.close}
        </button>
        <h2 className="mt-6 text-4xl sm:text-5xl">{title}</h2>
        {sub && <p className="mt-3 max-w-xl text-muted-foreground">{sub}</p>}
        <div className="mt-10">{children}</div>
      </div>
    </motion.div>
  );
}

function WallTitle({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="relative z-[1] px-6 pt-5 text-center sm:pt-7">
      <h2 className="font-serif text-2xl italic sm:text-3xl">{title}</h2>
      <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{sub}</p>
    </div>
  );
}

/** Clothing: a wooden rail across the whole wall, every garment hanging from it at the same scale. */
function ClothesWall({ items, w, h, onPick, onLooks }: { items: Product[]; w: number; h: number; onPick: (i: number) => void; onLooks: () => void }) {
  const { bi } = useT();
  const r = useC().room;
  const railTop = Math.max(104, h * 0.21);
  const hangerPx = Math.min(130, w * 0.2, Math.max(84, h * 0.15));
  const scale = (slug: string) => {
    const [, , hw] = HANG[slug] ?? [500, 680, 185];
    return hangerPx / hw;
  };
  const maxH = h - railTop - 150;
  // Same hanger size for every piece; on wide screens the whole rail fits the wall.
  const base = items.map((p) => {
    const [nw, nh] = HANG[p.slug] ?? [500, 680];
    const s = Math.min(scale(p.slug), maxH / nh);
    return { p, nw, nh, s };
  });
  const gap = 10;
  const total = base.reduce((t, b) => t + b.nw * b.s * 0.78 + gap, 0);
  const fit = w >= 900 ? Math.min(1, (w * 0.82) / total) : 1;
  return (
    <div className="absolute inset-0 flex flex-col">
      <WallTitle title={r.walls.clothes} sub={r.rail} />
      {/* the rail with its two brackets */}
      <span aria-hidden="true" className="absolute inset-x-[3%] h-[7px] rounded-full bg-gradient-to-b from-[#D2AE86] via-[#A47A52] to-[#6E4A2E] shadow-[0_4px_8px_rgba(40,20,5,0.35)]" style={{ top: railTop }} />
      <span aria-hidden="true" className="absolute left-[3%] h-10 w-2 -translate-y-8 rounded-sm bg-[#6E4A2E]" style={{ top: railTop }} />
      <span aria-hidden="true" className="absolute right-[3%] h-10 w-2 -translate-y-8 rounded-sm bg-[#6E4A2E]" style={{ top: railTop }} />
      <ul
        data-noturn={fit === 1 && total > w ? "" : undefined}
        className="absolute inset-x-0 flex snap-x items-start overflow-x-auto px-[6%] [scrollbar-width:none] [&>li:first-child]:ms-auto [&>li:last-child]:me-auto"
        style={{ top: railTop - hangerPx * fit * 0.2, height: maxH + 60, gap }}
      >
        {base.map(({ p, nw, nh, s: s0 }, i) => {
          const s = s0 * fit;
          return (
            <li key={p.slug} className="shrink-0 snap-center">
              <button type="button" onClick={() => onPick(i)} aria-label={bi(p.title)} className="room-hang group block origin-top" style={{ width: nw * s * 0.78, height: nh * s, ["--d" as string]: `${i * 0.35}s` }}>
                {/* eslint-disable-next-line @next/next/no-img-element -- local cut-out */}
                <img src={p.hanger} alt="" draggable={false} className="pointer-events-none mx-auto h-full w-auto max-w-none object-contain object-top drop-shadow-[0_22px_18px_rgba(40,20,5,0.28)] transition-[filter] duration-500 group-hover:drop-shadow-[0_30px_24px_rgba(40,20,5,0.34)]" style={{ marginInline: `${(-nw * s * 0.22) / 2}px` }} />
              </button>
            </li>
          );
        })}
      </ul>
      <div className="absolute inset-x-0 bottom-[118px] z-[1] flex justify-center">
        <button type="button" onClick={onLooks} className="min-h-10 rounded-full bg-bg/60 px-5 text-sm backdrop-blur ring-1 ring-line/15 transition-colors hover:bg-bg/90">
          {r.moreLooks}
        </button>
      </div>
    </div>
  );
}

/** Bags: a wooden cubby cabinet, one bag resting in each compartment. */
function BagsWall({ items, onPick }: { items: Product[]; onPick: (p: Product) => void }) {
  const { bi, locale } = useT();
  const c = useC();
  return (
    <div className="absolute inset-0 flex flex-col">
      <WallTitle title={c.room.walls.bags} sub={c.bags.sub} />
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-[92px] pt-3 sm:px-10">
        <div className="room-cabinet max-h-full w-full max-w-5xl overflow-y-auto rounded-md p-2.5 sm:p-3.5 [scrollbar-width:none]">
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5 sm:gap-2.5 lg:grid-cols-7">
            {items.map((b) => (
              <li key={b.slug}>
                <button type="button" onClick={() => onPick(b)} className="room-cubby group relative flex aspect-[4/5] w-full flex-col items-center justify-end overflow-hidden rounded-[3px] pb-5" aria-label={`${bi(b.title)}, ${formatSar(fromPrice(b), locale)}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- local cut-out */}
                  <img src={b.cutout ?? b.photos[0].src} alt="" loading="lazy" draggable={false} className="relative max-h-[74%] max-w-[82%] object-contain drop-shadow-[0_10px_8px_rgba(30,15,5,0.35)] transition-transform duration-500 ease-out group-hover:-translate-y-1.5 group-hover:scale-[1.04]" />
                  <span className="absolute inset-x-1 bottom-1 truncate text-center text-[10px] text-[#F3E6D3]/85 sm:text-[11px]">{formatSar(fromPrice(b), locale)}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/** Wall hangings: a few framed pieces hung salon-style, and the way into the whole gallery. */
function HangingsWall({ items, onBrowse }: { items: Product[]; onBrowse: () => void }) {
  const { bi } = useT();
  const c = useC();
  const picks = items.filter((p) => !p.showcase).slice(0, 7);
  const sizes = ["h-[52%]", "h-[70%]", "h-[46%]", "h-[80%]", "h-[46%]", "h-[70%]", "h-[52%]"];
  return (
    <div className="absolute inset-0 flex flex-col">
      <WallTitle title={c.room.walls.wall} sub={c.room.wallText} />
      <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-6 px-6 pb-[92px]">
        <ul className="flex h-[60%] w-full max-w-6xl items-center justify-center gap-3 sm:gap-6">
          {picks.map((p, i) => (
            <li key={p.slug} className={`${sizes[i]} ${i > 2 && i < 6 ? "" : "hidden sm:block"} ${i === 5 || i === 6 ? "hidden lg:block" : ""}`} style={{ marginTop: i % 2 ? "-6%" : "4%" }}>
              <button type="button" onClick={onBrowse} className="flex h-full items-center transition-transform duration-700 hover:-translate-y-1" aria-label={bi(p.title)}>
                {/* eslint-disable-next-line @next/next/no-img-element -- local photo */}
                <img src={p.photos[0].src} alt="" loading="lazy" draggable={false} className="block max-h-full w-auto max-w-[12.5vw] bg-surface p-1.5 max-lg:max-w-[22vw] max-sm:max-w-[58vw] shadow-[0_18px_30px_-16px_rgba(0,0,0,0.6)] ring-1 ring-line/10 sm:p-2" />
              </button>
            </li>
          ))}
        </ul>
        <button type="button" onClick={onBrowse} className="min-h-12 rounded-full bg-fg px-7 text-[15px] font-medium text-bg shadow-[0_18px_30px_-16px_rgba(30,15,5,0.6)] transition-opacity hover:opacity-90">
          {c.room.browseWall}
        </button>
      </div>
    </div>
  );
}

/** Dolls and bouquets standing on two wooden shelves. */
function ShelfWall({ items, onPick }: { items: Product[]; onPick: () => void }) {
  const { bi, locale } = useT();
  const c = useC();
  const rows = [items.slice(0, Math.ceil(items.length / 2)), items.slice(Math.ceil(items.length / 2))];
  return (
    <div className="absolute inset-0 flex flex-col">
      <WallTitle title={c.room.walls.dolls} sub={c.room.shelf} />
      <div className="flex min-h-0 flex-1 flex-col justify-center gap-[4%] px-[6%] pb-[100px]">
        {rows.map((row, k) => (
          <div key={k} className="relative h-[40%]">
            <ul className="flex h-full items-end justify-center gap-[6%] pb-3">
              {row.map((p) => (
                <li key={p.slug} className="flex h-full flex-col items-center justify-end">
                  <button type="button" onClick={onPick} className="group flex h-full flex-col items-center justify-end" aria-label={`${bi(p.title)}, ${formatSar(fromPrice(p), locale)}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- local cut-out */}
                    <img src={p.cutout ?? p.photos[0].src} alt="" loading="lazy" draggable={false} className="max-h-[92%] w-auto object-contain drop-shadow-[0_14px_10px_rgba(30,15,5,0.3)] transition-transform duration-500 group-hover:-translate-y-1.5" />
                  </button>
                </li>
              ))}
            </ul>
            <span aria-hidden="true" className="room-shelf absolute inset-x-0 bottom-0 h-3 rounded-sm" />
          </div>
        ))}
      </div>
    </div>
  );
}
