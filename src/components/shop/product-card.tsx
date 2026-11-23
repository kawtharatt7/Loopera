"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n/client";
import { formatSar, fromPrice, type Product } from "@/lib/shop/catalog";
import { PieceImage } from "./piece-image";

export function ProductCard({ product, aspect = "aspect-[4/5]", sizes = "(min-width: 768px) 25vw, 60vw" }: { product: Product; aspect?: string; sizes?: string }) {
  const { bi, t, locale } = useT();
  return (
    <Link href={`/shop/${product.slug}`} className="group block">
      <div className={`relative ${aspect} overflow-hidden rounded-md bg-surface`}>
        <PieceImage product={product} sizes={sizes} className="transition-transform duration-700 ease-out group-hover:scale-[1.04]" />
      </div>
      <div className="mt-3 flex items-baseline justify-between gap-3">
        <p className="font-medium underline-offset-4 group-hover:underline">{bi(product.title)}</p>
        <p className="shrink-0 tabular-nums">{formatSar(fromPrice(product), locale)}</p>
      </div>
      <p className="text-sm text-muted-foreground">{t.common.by(bi(product.maker))}</p>
    </Link>
  );
}

/** A horizontal row of cards that scrolls and snaps; arrows on wide screens. */
export function CardRow({ products }: { products: Product[] }) {
  return (
    <ul className="-mx-5 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-px-5 px-5 pb-4 sm:mx-0 sm:px-0 [scrollbar-width:thin]">
      {products.map((p) => (
        <li key={p.slug} className="w-[68vw] shrink-0 snap-start sm:w-[300px]">
          <ProductCard product={p} />
        </li>
      ))}
    </ul>
  );
}
