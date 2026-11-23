"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useT } from "@/lib/i18n/client";
import type { Product } from "@/lib/shop/catalog";
import { useTapestryImage } from "./piece-image";

function Hanging({ product, i }: { product: Product; i: number }) {
  const { bi } = useT();
  const src = useTapestryImage(product.tapestry, 10);
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, rotate: i % 2 ? 2 : -2 }}
      whileInView={{ opacity: 1, y: 0, rotate: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ type: "spring", stiffness: 70, damping: 9, delay: i * 0.08 }}
      style={{ originY: 0 }}
      className="w-[30%] max-w-[220px]"
    >
      <Link href={`/shop/${product.slug}`} className="block transition-transform duration-300 hover:-translate-y-1">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element -- generated from the stitch chart
          <img src={src} alt={bi(product.title)} className="w-full drop-shadow-[0_18px_22px_rgba(0,0,0,0.35)]" />
        ) : (
          <div className="aspect-[3/4.6] animate-pulse rounded bg-surface-2" />
        )}
        <p className="mt-2 text-center text-sm">{bi(product.title)}</p>
      </Link>
    </motion.div>
  );
}

/** Three hangings on a stretch of wall, swinging into place, with the way into the 3D gallery. */
export function WallPreview({ products }: { products: Product[] }) {
  const { t } = useT();
  return (
    <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.4fr]">
      <div>
        <p className="max-w-md text-lg leading-relaxed text-muted-foreground">{t.shop.wallLine}</p>
        <Link href="/shop/wall" className="mt-6 inline-flex h-12 items-center gap-3 rounded-lg bg-primary px-6 font-medium text-primary-fg hover:opacity-90">
          {t.shop.wallEnter}
          <svg viewBox="0 0 20 20" className="h-4 w-4 rtl:-scale-x-100" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 10h12M11 5l5 5-5 5" />
          </svg>
        </Link>
      </div>
      <div className="flex items-start justify-center gap-[4%] rounded-xl bg-surface/60 px-4 pb-8 pt-10">
        {products.slice(0, 3).map((p, i) => (
          <Hanging key={p.slug} product={p} i={i} />
        ))}
      </div>
    </div>
  );
}
