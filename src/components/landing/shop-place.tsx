"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { PieceIllustration } from "@/components/shop/piece-illustration";
import { ArrowIcon, ButtonLink } from "@/components/ui/button";
import { DEMO_PRODUCTS, formatSar } from "@/lib/demo/products";

/** Pieces hanging on a rail. Each card swings gently on hover, like a hanger being nudged. */
export function ShopPlace() {
  const reduce = useReducedMotion();
  return (
    <section id="shop-place" aria-labelledby="shop-place-heading" className="relative scroll-mt-20 overflow-hidden py-24 sm:py-32">
      <div aria-hidden="true" className="pointer-events-none absolute -left-40 top-10 h-96 w-96 rounded-full bg-peach/15 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-wine/25 blur-3xl" />

      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-brand">Shop · I want to buy</p>
            <h2 id="shop-place-heading" className="mt-3 text-balance text-4xl leading-tight sm:text-5xl">
              Handmade pieces, straight from the people who made them.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              Pick a color and a size, or send your own Studio design to a maker as a custom order.
            </p>
          </div>
          <ButtonLink href="/shop" size="lg" variant="wine">
            Browse the Shop <ArrowIcon />
          </ButtonLink>
        </div>

        {/* The rail */}
        <div className="relative mt-16">
          <div aria-hidden="true" className="absolute inset-x-0 top-0 h-2 rounded-full bg-gradient-to-r from-wine via-peach/80 to-wine shadow-[0_2px_0_rgb(var(--bg)/0.6)]" />
          <ul className="-mx-5 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-6 pt-1 sm:mx-0 sm:px-1 [scrollbar-width:thin]">
            {DEMO_PRODUCTS.map((p, i) => (
              <li key={p.slug} className="w-56 shrink-0 snap-start sm:w-60">
                <Link href="/shop" className="group block rounded-4xl focus-visible:outline-offset-4" aria-label={`${p.title} by ${p.maker}, ${formatSar(p.priceSar)}`}>
                  {/* hanger hook */}
                  <svg viewBox="0 0 40 34" className="mx-auto -mt-1 h-8 w-10 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                    <path d="M20 2c-5 0-6 7 0 8v6M4 32 20 16l16 16" />
                  </svg>
                  <motion.div
                    whileHover={reduce ? undefined : { rotate: [0, -2.5, 1.8, -1, 0] }}
                    transition={{ duration: 1.1, ease: "easeInOut" }}
                    style={{ originY: 0, originX: 0.5 }}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                  >
                    <div className="relative -mt-1 rounded-4xl border border-line/10 bg-surface p-4 transition-colors duration-300 group-hover:bg-surface-2">
                      <PieceIllustration product={p} color={p.colors[0].hex} className="mx-auto h-48 w-40 drop-shadow-xl" />
                      <div className="mt-3 flex items-start justify-between gap-2">
                        <div>
                          <p className="font-serif text-lg leading-snug">{p.title}</p>
                          <p className="text-sm text-muted-foreground">{p.maker}</p>
                        </div>
                        <p className="shrink-0 rounded-full bg-bg/70 px-3 py-1 text-sm font-medium tabular-nums">{formatSar(p.priceSar)}</p>
                      </div>
                      <div className="mt-3 flex gap-1.5" aria-label={`${p.colors.length} colors`}>
                        {p.colors.map((c) => (
                          <span key={c.name} title={c.name} className="h-4 w-4 rounded-full ring-1 ring-line/20" style={{ backgroundColor: c.hex }} />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </Link>
                <span className="sr-only">Item {i + 1} of {DEMO_PRODUCTS.length}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
