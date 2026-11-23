"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { useBag } from "@/components/bag/bag-context";
import { useT } from "@/lib/i18n/client";
import { formatSar, stockFor, type Product } from "@/lib/shop/catalog";
import { useRecolored } from "@/lib/shop/recolor";

/**
 * Bags, laid out like the shoe product hero (name on one side, the bag standing in the middle
 * over a big brand word, size, price and colors on the other), but the bag stands straight,
 * and picking a color repaints the same bag in place. The thumbnails switch between bags.
 */
export function BagShowcase({ bags, linkToPage = true }: { bags: Product[]; linkToPage?: boolean }) {
  const { t, bi, locale } = useT();
  const { add } = useBag();
  const reduce = useReducedMotion() ?? false;
  const [index, setIndex] = useState(0);
  const [colorBy, setColorBy] = useState<Record<string, string>>({});
  const [sizeBy, setSizeBy] = useState<Record<string, string>>({});
  const [added, setAdded] = useState<string | null>(null);
  const bag = bags[index];
  const colorId = colorBy[bag.slug] ?? bag.colors[0].id;
  const color = bag.colors.find((c) => c.id === colorId) ?? bag.colors[0];
  const sizeId = sizeBy[bag.slug] ?? bag.sizes[0].id;
  const size = bag.sizes.find((s) => s.id === sizeId) ?? bag.sizes[0];
  const left = stockFor(bag, colorId, sizeId);
  const base = bag.cutout ?? bag.photos[0].src;
  const recipe = bag.recolor ? { from: bag.recolor.from, mask: bag.cutout ? undefined : bag.recolor.mask } : undefined;
  const src = useRecolored(base, recipe, color.hex === "transparent" ? null : color.hex);
  const swatch = (hex: string) => (hex === "transparent" ? (bag.recolor?.from ?? "#999") : hex);

  return (
    <div className="relative overflow-hidden border-y border-line/10">
      <div className="mx-auto grid min-h-[min(86svh,760px)] max-w-7xl items-center gap-8 px-5 py-12 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,1fr)]">
        {/* Name, story, other bags */}
        <div className="order-2 lg:order-1">
          <p className="text-sm lowercase tracking-wide text-muted-foreground">loopera</p>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={bag.slug} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35 }}>
              <h3 className="mt-2 text-3xl leading-tight sm:text-4xl">{bi(bag.title)}</h3>
              <p className="mt-3 max-w-sm leading-relaxed text-muted-foreground">{bi(bag.description)}</p>
              {linkToPage && (
                <Link href={`/shop/${bag.slug}`} className="mt-4 inline-block text-sm underline underline-offset-4">
                  {t.shop.openPiece}
                </Link>
              )}
            </motion.div>
          </AnimatePresence>
          {bags.length > 1 && (
            <ul className="mt-8 flex flex-wrap gap-2" aria-label={t.shop.bagsHeadline}>
              {bags.map((b, i) => (
                <li key={b.slug}>
                  <button
                    type="button"
                    onClick={() => setIndex(i)}
                    aria-label={bi(b.title)}
                    aria-pressed={i === index}
                    className={`relative block h-16 w-14 overflow-hidden rounded-sm border bg-surface transition-colors ${i === index ? "border-fg" : "border-line/20 hover:border-line/60"}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- small local thumbnail */}
                    <img src={b.photos[0].src} alt="" className="h-full w-full object-cover" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* The bag */}
        <div className="relative order-1 flex h-[min(52svh,480px)] items-center justify-center lg:order-2">
          <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-[6%] select-none text-center font-serif text-[22vw] font-bold lowercase leading-none tracking-[-0.06em] text-fg/[0.06] lg:text-[11vw]">
            loopera
          </span>
          <span aria-hidden="true" className="absolute bottom-[8%] left-1/2 h-8 w-1/2 -translate-x-1/2 rounded-[50%] bg-black/45 blur-xl" />
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={bag.slug}
              className="relative h-[82%] w-[86%]"
              initial={reduce ? false : { opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -20 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <motion.div className="relative h-full w-full" animate={reduce ? undefined : { y: [0, -8, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}>
                {/* Color changes repaint the same bag: only the image's pixels change, nothing moves. */}
                <AnimatePresence initial={false}>
                  <motion.img
                    key={src}
                    src={src}
                    alt={`${bi(bag.title)}, ${bi(color.name)}`}
                    className={`absolute inset-0 h-full w-full ${bag.cutout ? "object-contain drop-shadow-[0_24px_30px_rgba(0,0,0,0.35)]" : "object-cover"}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.45 }}
                    draggable={false}
                  />
                </AnimatePresence>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Size, price, color, add */}
        <div className="order-3 flex flex-col gap-6">
          <fieldset>
            <legend className="text-sm text-muted-foreground">{t.common.size}</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {bag.sizes.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={s.id === sizeId}
                  onClick={() => setSizeBy((m) => ({ ...m, [bag.slug]: s.id }))}
                  className={`min-h-11 rounded-sm border px-4 text-sm ${s.id === sizeId ? "border-fg bg-fg text-bg" : "border-line/25 hover:border-fg"}`}
                >
                  {bi(s.label)}
                </button>
              ))}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{left === 0 ? t.common.soldOut : left <= 2 ? t.common.onlyLeft(left) : t.common.inStock}</p>
          </fieldset>
          <div className="flex items-baseline justify-between border-y border-line/10 py-4">
            <span className="text-sm text-muted-foreground">{bi(bag.maker)}</span>
            <span className="text-2xl tabular-nums">{formatSar(size.price, locale)}</span>
          </div>
          <fieldset>
            <legend className="text-sm text-muted-foreground">
              {t.common.color}: <span className="text-fg">{bi(color.name)}</span>
            </legend>
            <div className="mt-3 flex flex-wrap gap-2.5">
              {bag.colors.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={c.id === colorId}
                  aria-label={bi(c.name)}
                  title={bi(c.name)}
                  onClick={() => setColorBy((m) => ({ ...m, [bag.slug]: c.id }))}
                  className={`h-10 w-10 rounded-full border-2 p-0.5 transition-colors ${c.id === colorId ? "border-fg" : "border-transparent hover:border-line/50"}`}
                >
                  <span className="block h-full w-full rounded-full ring-1 ring-line/20" style={{ background: swatch(c.hex) }} />
                </button>
              ))}
            </div>
          </fieldset>
          <button
            type="button"
            disabled={left === 0}
            onClick={() => {
              if (add({ slug: bag.slug, color: colorId, size: sizeId })) setAdded(bag.slug + colorId);
            }}
            className="min-h-12 rounded-sm bg-primary px-6 font-medium text-primary-fg transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {added === bag.slug + colorId ? t.common.added : t.common.addToBag}
          </button>
        </div>
      </div>
    </div>
  );
}
