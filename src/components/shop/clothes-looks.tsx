"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useC } from "@/lib/i18n/collection";
import { useT } from "@/lib/i18n/client";
import { formatSar, fromPrice, type ColorOption, type Product } from "@/lib/shop/catalog";
import { useRecolored } from "@/lib/shop/recolor";
import { ProductDialog } from "./bags-grid";

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

/** The garment alone on its wooden hanger, repainted in the chosen yarn (the hanger stays wood). */
function HangerPhoto({ product, colorId, className = "" }: { product: Product; colorId: string; className?: string }) {
  const { bi } = useT();
  const color = product.colors.find((c) => c.id === colorId) ?? product.colors[0];
  const recipe = useMemo(() => (product.recolor ? { from: product.recolor.from, mask: product.masks?.hanger } : undefined), [product.recolor, product.masks]);
  const src = useRecolored(product.hanger ?? product.photos[0].src, recipe, color.hex === "transparent" ? null : color.hex);
  // eslint-disable-next-line @next/next/no-img-element -- local cut-out or its repainted copy
  return <img src={src} alt={`${bi(product.title)}, ${bi(color.name)}`} className={className} draggable={false} />;
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
              {p.hanger ? (
                <span className="relative flex aspect-[8/9] items-center justify-center overflow-hidden rounded-sm bg-surface ring-1 ring-line/5">
                  <span aria-hidden="true" className="absolute inset-0" style={{ background: "radial-gradient(80% 60% at 70% 10%, rgb(255 236 210 / 0.8), transparent 70%)" }} />
                  <HangerPhoto product={p} colorId={colorOf(p)} className="relative max-h-[88%] max-w-[84%] object-contain drop-shadow-[0_22px_18px_rgba(60,30,10,0.22)] transition-transform duration-700 ease-out group-hover:-translate-y-1.5 group-hover:rotate-[-1.5deg]" />
                  <span className="stitch absolute end-3 top-3 rounded-sm bg-[#26211E] px-2.5 py-1 text-xs font-medium text-[#FAF7F2]" style={{ outlineColor: "rgb(250 247 242 / 0.5)", outlineOffset: "-3px" }}>
                    {c.tryOn}
                  </span>
                </span>
              ) : (
                <span className="relative block aspect-[8/9] overflow-hidden rounded-sm bg-surface shadow-[0_24px_40px_-28px_rgba(60,30,10,0.45)]">
                  <LookPhoto product={p} colorId={colorOf(p)} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035]" />
                  <span className="absolute bottom-3 start-3 rounded-sm bg-bg/85 px-2.5 py-1 text-xs opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">{c.open}</span>
                </span>
              )}
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
      {open !== null && products[open] && <ProductDialog key={products[open].slug} product={products[open]} onClose={() => setOpen(null)} />}
    </>
  );
}
