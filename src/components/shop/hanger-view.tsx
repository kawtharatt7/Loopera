"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { useBag } from "@/components/bag/bag-context";
import { useC } from "@/lib/i18n/collection";
import { useT } from "@/lib/i18n/client";
import { addToCart } from "@/lib/shop/cart";
import { formatSar, type ColorOption, type Product } from "@/lib/shop/catalog";
import { useRecolored } from "@/lib/shop/recolor";

const swatchOf = (p: Product, c: ColorOption) => (c.hex === "transparent" ? (p.recolor?.from ?? "#C9785C") : c.hex);

/** The garment on its hanger, repainted in the chosen yarn. Only the garment changes: the hanger stays wood. */
function Piece({ product, colorId, imgRef }: { product: Product; colorId: string; imgRef: React.RefObject<HTMLImageElement | null> }) {
  const { bi } = useT();
  const color = product.colors.find((c) => c.id === colorId) ?? product.colors[0];
  const recipe = useMemo(() => (product.recolor ? { from: product.recolor.from, mask: product.masks?.hanger } : undefined), [product]);
  const src = useRecolored(product.hanger ?? product.photos[0].src, recipe, color.hex === "transparent" ? null : color.hex);
  return (
    // eslint-disable-next-line @next/next/no-img-element -- local cut-out or its repainted copy
    <img
      ref={imgRef}
      src={src}
      alt={`${bi(product.title)}, ${bi(color.name)}`}
      draggable={false}
      className="max-h-full max-w-full object-contain object-top drop-shadow-[0_30px_26px_rgba(40,22,10,0.28)] transition-[filter] duration-500"
    />
  );
}

/** Sends a copy of the piece flying into the bag icon in the header, then gives the icon a small bounce. */
function flyToBag(img: HTMLImageElement | null) {
  const target = document.querySelector<HTMLElement>("[data-bag-icon]");
  if (!img || !target || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const a = img.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  const dx = b.left + b.width / 2 - (a.left + a.width / 2);
  const dy = b.top + b.height / 2 - (a.top + a.height / 2);
  const ghost = img.cloneNode() as HTMLImageElement;
  Object.assign(ghost.style, { position: "fixed", left: `${a.left}px`, top: `${a.top}px`, width: `${a.width}px`, height: `${a.height}px`, zIndex: "1000", pointerEvents: "none", margin: "0", objectFit: "contain" });
  document.body.appendChild(ghost);
  const fly = ghost.animate(
    [
      { transform: "translate(0,0) scale(1) rotate(0deg)", opacity: 1 },
      { transform: `translate(${dx * 0.45}px, ${dy * 0.45 - 60}px) scale(0.55) rotate(-6deg)`, opacity: 1, offset: 0.5 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.05) rotate(4deg)`, opacity: 0.4 },
    ],
    { duration: 950, easing: "cubic-bezier(.55,0,.25,1)" },
  );
  fly.onfinish = () => {
    ghost.remove();
    target.animate([{ transform: "scale(1)" }, { transform: "scale(1.28)" }, { transform: "scale(1)" }], { duration: 380, easing: "ease-out" });
  };
}

/**
 * A garment from the rail, up close: large on its hanger in the middle of the room, with the
 * previous and next pieces a click (or arrow key) away. Size, colour and quantity live only here.
 */
export function HangerView({ products, index, onIndex, onClose }: { products: Product[]; index: number; onIndex: (i: number) => void; onClose: () => void }) {
  const { bi, locale } = useT();
  const c = useC();
  const r = c.room;
  const { setOpen } = useBag();
  const p = products[index];
  const [dir, setDir] = useState(1);
  const [colorId, setColorId] = useState(p.colors[0].id);
  const [sizeId, setSizeId] = useState(p.sizes[1]?.id ?? p.sizes[0].id);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  // A new piece starts fresh: its first colour, a middle size, one of it.
  useEffect(() => {
    setColorId(p.colors[0].id);
    setSizeId(p.sizes[1]?.id ?? p.sizes[0].id);
    setQty(1);
    setAdded(false);
  }, [p]);

  const step = (d: number) => {
    setDir(d);
    onIndex((index + d + products.length) % products.length);
  };

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (document.querySelector("[role=dialog][aria-modal=true]:not([data-hanger])")) return;
      if (e.key === "Escape") onClose();
      const rtl = document.documentElement.dir === "rtl";
      if (e.key === "ArrowRight") step(rtl ? -1 : 1);
      if (e.key === "ArrowLeft") step(rtl ? 1 : -1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- step reads the latest index
  }, [index, onClose]);

  const size = p.sizes.find((s) => s.id === sizeId) ?? p.sizes[0];
  const color = p.colors.find((x) => x.id === colorId) ?? p.colors[0];

  const add = () => {
    if (!addToCart({ slug: p.slug, color: color.id, size: size.id }, qty)) return;
    flyToBag(imgRef.current);
    setAdded(true);
  };

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      data-hanger
      aria-label={bi(p.title)}
      className="fixed inset-x-0 bottom-0 top-16 z-40 overflow-y-auto bg-bg/95 backdrop-blur-md lg:overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="mx-auto grid h-full max-w-7xl gap-6 px-4 pb-10 pt-4 sm:px-8 lg:grid-cols-[1fr_380px] lg:gap-10 lg:pb-8">
        {/* The piece */}
        <div className="relative flex min-h-[58svh] flex-col lg:min-h-0">
          <div className="flex items-center justify-between gap-3">
            <button ref={closeRef} type="button" onClick={onClose} className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm text-fg/80 transition-colors hover:bg-surface hover:text-fg">
              <svg aria-hidden="true" viewBox="0 0 16 16" className="h-4 w-4 rtl:-scale-x-100" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 3L5 8l5 5" />
              </svg>
              {r.close}
            </button>
            <span className="text-sm tabular-nums text-muted-foreground">{r.pieceOf(index + 1, products.length)}</span>
          </div>

          <div className="relative mt-2 flex-1 overflow-hidden">
            {/* rail and soft light */}
            <span aria-hidden="true" className="absolute inset-x-[8%] top-3 h-[6px] rounded-full bg-gradient-to-b from-[#C9A27A] to-[#7A5536] shadow-[0_3px_6px_rgba(40,20,5,0.3)]" />
            <span aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(45% 55% at 50% 30%, rgb(255 236 210 / 0.35), transparent 72%)" }} />
            <AnimatePresence initial={false} custom={dir} mode="popLayout">
              <motion.div
                key={p.slug}
                custom={dir}
                className="absolute inset-x-0 bottom-0 top-1 flex justify-center px-14"
                variants={{
                  in: (d: number) => ({ x: `${d * 60}%`, opacity: 0, rotate: d * 4 }),
                  on: { x: 0, opacity: 1, rotate: 0 },
                  out: (d: number) => ({ x: `${d * -60}%`, opacity: 0, rotate: d * -4 }),
                }}
                initial="in"
                animate="on"
                exit="out"
                transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
                style={{ transformOrigin: "50% 0%" }}
              >
                <Piece product={p} colorId={colorId} imgRef={imgRef} />
              </motion.div>
            </AnimatePresence>
            {products.length > 1 && (
              <>
                <button type="button" onClick={() => step(-1)} aria-label={r.prev} className="absolute start-0 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-bg/70 backdrop-blur transition-colors hover:bg-surface">
                  <svg aria-hidden="true" viewBox="0 0 16 16" className="h-4 w-4 rtl:-scale-x-100" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 3L5 8l5 5" />
                  </svg>
                </button>
                <button type="button" onClick={() => step(1)} aria-label={r.next} className="absolute end-0 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-bg/70 backdrop-blur transition-colors hover:bg-surface">
                  <svg aria-hidden="true" viewBox="0 0 16 16" className="h-4 w-4 rtl:-scale-x-100" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 3l5 5-5 5" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Size, colour, quantity: only here */}
        <motion.aside
          key={`panel-${p.slug}`}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="self-center rounded-2xl bg-surface/70 p-6 shadow-[0_30px_60px_-40px_rgba(40,20,5,0.5)] ring-1 ring-line/10 backdrop-blur sm:p-7"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{bi(p.maker)}</p>
          <h2 className="mt-2 font-serif text-3xl leading-tight">{bi(p.title)}</h2>
          <p className="mt-2 text-lg tabular-nums">{formatSar(size.price * qty, locale)}</p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{bi(p.description)}</p>
          <p className="mt-1 text-sm text-muted-foreground">{c.readyIn(p.leadTimeDays)}</p>

          <fieldset className="mt-6">
            <legend className="text-sm font-medium">
              {r.colour} <span className="font-normal text-muted-foreground">· {bi(color.name)}</span>
            </legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {p.colors.map((col) => (
                <button
                  key={col.id}
                  type="button"
                  aria-pressed={col.id === colorId}
                  aria-label={bi(col.name)}
                  title={bi(col.name)}
                  onClick={() => {
                    setColorId(col.id);
                    setAdded(false);
                  }}
                  className={`h-10 w-10 rounded-full border-2 p-0.5 transition-colors duration-300 ${col.id === colorId ? "border-fg" : "border-transparent hover:border-line/50"}`}
                >
                  <span className="block h-full w-full rounded-full ring-1 ring-line/20" style={{ background: swatchOf(p, col) }} />
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-6">
            <legend className="text-sm font-medium">{r.size}</legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {p.sizes.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={s.id === sizeId}
                  onClick={() => {
                    setSizeId(s.id);
                    setAdded(false);
                  }}
                  className={`min-h-11 min-w-12 rounded-full px-4 text-sm transition-colors duration-300 ${s.id === sizeId ? "bg-fg text-bg" : "border border-fg/20 hover:border-fg/60"}`}
                >
                  {bi(s.label)}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="mt-6 flex items-center gap-4">
            <span className="text-sm font-medium">{r.qty}</span>
            <div className="inline-flex items-center rounded-full border border-fg/20">
              <button type="button" aria-label="−" onClick={() => setQty((q) => Math.max(1, q - 1))} className="h-11 w-11 rounded-full text-lg hover:bg-surface-2">
                −
              </button>
              <span className="w-8 text-center tabular-nums" aria-live="polite">
                {qty}
              </span>
              <button type="button" aria-label="+" onClick={() => setQty((q) => Math.min(9, q + 1))} className="h-11 w-11 rounded-full text-lg hover:bg-surface-2">
                +
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={add}
            className={`mt-7 flex min-h-12 w-full items-center justify-center rounded-full text-[15px] font-medium transition-colors duration-500 ${added ? "bg-sage text-white" : "bg-fg text-bg hover:opacity-90"}`}
          >
            {added ? r.added : r.add}
          </button>
          <AnimatePresence>
            {added && (
              <motion.button
                type="button"
                onClick={() => setOpen(true)}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 w-full text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
              >
                {r.viewBag}
              </motion.button>
            )}
          </AnimatePresence>
        </motion.aside>
      </div>
    </motion.div>
  );
}
