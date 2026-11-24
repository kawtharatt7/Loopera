"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useBag } from "@/components/bag/bag-context";
import { useC } from "@/lib/i18n/collection";
import { useT } from "@/lib/i18n/client";
import { formatSar, fromPrice, type ColorOption, type Product } from "@/lib/shop/catalog";
import { useRecolored } from "@/lib/shop/recolor";

const swatchOf = (p: Product, c: ColorOption) => (c.hex === "transparent" ? (p.recolor?.from ?? "#C9785C") : c.hex);

/** The look photo, repainted in the chosen yarn (only the garment changes: the model and backdrop stay). */
function LookPhoto({ product, colorId, className = "", onSrc }: { product: Product; colorId: string; className?: string; onSrc?: (s: string) => void }) {
  const { bi } = useT();
  const color = product.colors.find((c) => c.id === colorId) ?? product.colors[0];
  const src = useRecolored(product.photos[0].src, product.recolor, color.hex === "transparent" ? null : color.hex);
  useEffect(() => onSrc?.(src), [src, onSrc]);
  return (
    <AnimatePresence initial={false}>
      {/* eslint-disable-next-line @next/next/no-img-element -- local photo or its repainted copy */}
      <motion.img key={src} src={src} alt={`${bi(product.photos[0].alt)}, ${bi(color.name)}`} className={className} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} draggable={false} />
    </AnimatePresence>
  );
}

function Swatches({ product, value, onChange, size = "sm" }: { product: Product; value: string; onChange: (id: string) => void; size?: "sm" | "lg" }) {
  const { bi } = useT();
  const c = useC();
  return (
    <div role="group" aria-label={c.color} className={`flex flex-wrap ${size === "lg" ? "gap-2.5" : "gap-1.5"}`}>
      {product.colors.map((col) => (
        <button
          key={col.id}
          type="button"
          aria-pressed={col.id === value}
          aria-label={bi(col.name)}
          title={bi(col.name)}
          onClick={(e) => {
            e.stopPropagation();
            onChange(col.id);
          }}
          className={`rounded-full border-2 p-0.5 transition-colors ${size === "lg" ? "h-10 w-10" : "h-7 w-7"} ${col.id === value ? "border-fg" : "border-transparent hover:border-line/50"}`}
        >
          <span className="block h-full w-full rounded-full ring-1 ring-line/20" style={{ background: swatchOf(product, col) }} />
        </button>
      ))}
    </div>
  );
}

/**
 * Clothes, worn by models in the warm studio. Each card can be repainted in the six house colours;
 * tapping the look opens it up close with a stitch magnifier, sizes and the made-to-order date.
 */
export function ClothesLooks({ products }: { products: Product[] }) {
  const { bi, locale } = useT();
  const c = useC();
  const [colorBy, setColorBy] = useState<Record<string, string>>({});
  const [open, setOpen] = useState<number | null>(null);
  const colorOf = (p: Product) => colorBy[p.slug] ?? p.colors[0].id;
  const setColor = (slug: string, id: string) => setColorBy((m) => ({ ...m, [slug]: id }));

  return (
    <>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
        {products.map((p, i) => (
          <li key={p.slug}>
            <button type="button" onClick={() => setOpen(i)} aria-haspopup="dialog" className="group block w-full text-start">
              <span className="relative block aspect-[8/9] overflow-hidden rounded-sm bg-surface shadow-[0_24px_40px_-28px_rgba(60,30,10,0.45)]">
                <LookPhoto product={p} colorId={colorOf(p)} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035]" />
                <span className="absolute bottom-3 start-3 rounded-sm bg-bg/85 px-2.5 py-1 text-xs opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">{c.open}</span>
              </span>
            </button>
            <div className="mt-3 flex items-baseline justify-between gap-3">
              <h3 className="font-serif text-lg leading-snug">{bi(p.title)}</h3>
              <span className="shrink-0 text-sm tabular-nums text-muted-foreground">{formatSar(fromPrice(p), locale)}</span>
            </div>
            <div className="mt-2">
              <Swatches product={p} value={colorOf(p)} onChange={(id) => setColor(p.slug, id)} />
            </div>
          </li>
        ))}
      </ul>
      {open !== null && products[open] && <LookDialog product={products[open]} colorId={colorOf(products[open])} onColor={(id) => setColor(products[open].slug, id)} onClose={() => setOpen(null)} />}
    </>
  );
}

function LookDialog({ product, colorId, onColor, onClose }: { product: Product; colorId: string; onColor: (id: string) => void; onClose: () => void }) {
  const { bi, locale } = useT();
  const c = useC();
  const { add } = useBag();
  const reduce = useReducedMotion() ?? false;
  const [sizeId, setSizeId] = useState(product.sizes[1]?.id ?? product.sizes[0].id);
  const [added, setAdded] = useState(false);
  const [src, setSrc] = useState(product.photos[0].src);
  const [lens, setLens] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const frame = useRef<HTMLDivElement | null>(null);
  const size = product.sizes.find((s) => s.id === sizeId) ?? product.sizes[0];
  const onSrc = useCallback((s: string) => setSrc(s), []);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      opener?.focus?.();
    };
  }, [onClose]);
  useEffect(() => setAdded(false), [colorId, sizeId]);

  const move = (e: React.PointerEvent) => {
    const r = frame.current?.getBoundingClientRect();
    if (!r) return;
    if (e.pointerType === "touch" && e.buttons === 0) return;
    setLens({ x: e.clientX - r.left, y: e.clientY - r.top, w: r.width, h: r.height });
  };
  const Z = 2.6;
  const L = 170;

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={bi(product.title)} className="fixed inset-0 z-[75] flex items-stretch justify-center sm:items-center sm:p-6">
      <motion.button type="button" tabIndex={-1} aria-label={c.close} onClick={onClose} className="absolute inset-0 bg-[rgb(38_33_30/0.5)] backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
      <motion.div
        className="relative grid max-h-full w-full max-w-5xl overflow-y-auto bg-bg shadow-[0_40px_120px_-30px_rgba(0,0,0,0.5)] sm:rounded md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]"
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        <div
          ref={frame}
          className="relative aspect-[8/9] cursor-zoom-in touch-none overflow-hidden bg-surface md:aspect-auto md:min-h-[560px]"
          onPointerMove={move}
          onPointerDown={(e) => {
            (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
            move(e);
          }}
          onPointerUp={(e) => e.pointerType === "touch" && setLens(null)}
          onPointerLeave={() => setLens(null)}
        >
          <LookPhoto product={product} colorId={colorId} onSrc={onSrc} className="absolute inset-0 h-full w-full object-cover" />
          {lens && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute rounded-full shadow-[0_0_0_3px_rgb(var(--bg)),0_18px_40px_-10px_rgba(0,0,0,0.5)]"
              style={{
                width: L,
                height: L,
                left: lens.x - L / 2,
                top: lens.y - L / 2,
                backgroundImage: `url("${src}")`,
                backgroundRepeat: "no-repeat",
                backgroundSize: `${lens.w * Z}px ${lens.h * Z}px`,
                backgroundPosition: `${-(lens.x * Z - L / 2)}px ${-(lens.y * Z - L / 2)}px`,
              }}
            />
          )}
          <span className="pointer-events-none absolute bottom-3 start-3 rounded-sm bg-bg/80 px-2.5 py-1 text-xs text-muted-foreground backdrop-blur">
            <span className="hidden [@media(pointer:fine)]:inline">{c.zoomHint}</span>
            <span className="[@media(pointer:fine)]:hidden">{c.zoomHintTouch}</span>
          </span>
        </div>

        <div className="flex flex-col gap-6 p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{bi(product.maker)}</p>
              <h2 className="mt-1 text-3xl">{bi(product.title)}</h2>
            </div>
            <button type="button" onClick={onClose} autoFocus className="inline-flex h-11 shrink-0 items-center gap-2 rounded-sm px-3 text-sm hover:bg-surface">
              {c.close}
              <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                <path d="M3 3l10 10M13 3L3 13" />
              </svg>
            </button>
          </div>
          <p className="leading-relaxed text-muted-foreground">{bi(product.description)}</p>
          <p className="inline-flex w-fit items-center gap-2 rounded-sm bg-sage/12 px-3 py-1.5 text-sm text-fg">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-sage" />
            {c.readyIn(product.leadTimeDays)}
          </p>
          <fieldset>
            <legend className="mb-2 text-sm text-muted-foreground">{c.size}</legend>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((s) => (
                <button key={s.id} type="button" aria-pressed={s.id === sizeId} onClick={() => setSizeId(s.id)} className={`h-11 min-w-12 rounded-sm border px-3 text-sm ${s.id === sizeId ? "border-fg bg-fg text-bg" : "border-line/25 hover:border-fg"}`}>
                  {bi(s.label)}
                </button>
              ))}
            </div>
          </fieldset>
          <div>
            <p className="mb-2 text-sm text-muted-foreground">
              {c.color}: <span className="text-fg">{bi((product.colors.find((x) => x.id === colorId) ?? product.colors[0]).name)}</span>
            </p>
            <Swatches product={product} value={colorId} onChange={onColor} size="lg" />
          </div>
          <div className="mt-auto flex items-center justify-between gap-4 border-t border-line/10 pt-5">
            <span className="text-2xl tabular-nums">{formatSar(size.price, locale)}</span>
            <button
              type="button"
              onClick={() => add({ slug: product.slug, color: colorId, size: sizeId }) && setAdded(true)}
              className={`min-h-12 rounded-sm px-7 font-medium transition-colors ${added ? "bg-sage text-white" : "bg-primary text-primary-fg hover:opacity-90"}`}
              aria-live="polite"
            >
              {added ? c.added : c.addToBag}
            </button>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body,
  );
}
