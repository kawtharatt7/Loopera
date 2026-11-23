"use client";

import Image from "next/image";
import Link from "next/link";
import { useT } from "@/lib/i18n/client";
import { formatSar, fromPrice, type Product } from "@/lib/shop/catalog";
import { ProductCard } from "./product-card";

/** Graduation: one real piece, shown large, with how ordering works. */
export function GraduationFeature({ products }: { products: Product[] }) {
  const { t, bi, locale } = useT();
  const main = products[0];
  if (!main) return null;
  return (
    <div className="grid items-center gap-10 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-16">
      <Link href={`/shop/${main.slug}`} className="group relative block aspect-[4/5] overflow-hidden bg-surface">
        <Image src={main.photos[0].src} alt={bi(main.photos[0].alt)} fill sizes="(min-width: 768px) 42vw, 100vw" className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]" />
      </Link>
      <div className="max-w-lg">
        <p className="text-sm text-muted-foreground">{t.common.by(bi(main.maker))}</p>
        <h3 className="mt-1 text-3xl">{bi(main.title)}</h3>
        <p className="mt-4 leading-relaxed text-muted-foreground">{t.shop.gradText}</p>
        <ol className="mt-6 divide-y divide-line/10 border-y border-line/10">
          {t.shop.gradSteps.map((step, i) => (
            <li key={step} className="flex items-baseline gap-4 py-3">
              <span className="w-5 shrink-0 tabular-nums text-muted-foreground">{i + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Link href={`/shop/${main.slug}`} className="inline-flex min-h-12 items-center rounded-sm bg-primary px-7 font-medium text-primary-fg hover:opacity-90">
            {t.shop.gradCta}
          </Link>
          <span className="tabular-nums">
            {t.common.from} {formatSar(fromPrice(main), locale)}
          </span>
        </div>
      </div>
    </div>
  );
}

/** Wall hangings are made to order: what can be ordered, and a way to chart the idea first. */
export function WallCustom({ products }: { products: Product[] }) {
  const { t } = useT();
  return (
    <div className="grid gap-10 md:grid-cols-2 lg:gap-16">
      <div className="max-w-lg">
        <p className="text-lg leading-relaxed">{t.shop.wallText}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          {products.length >= 3 && (
            <Link href="/shop/wall" className="inline-flex min-h-12 items-center rounded-sm bg-primary px-7 font-medium text-primary-fg hover:opacity-90">
              {t.shop.wallEnter}
            </Link>
          )}
          <Link href="/creator?type=wall" className="inline-flex min-h-12 items-center rounded-sm border border-fg/40 px-7 font-medium hover:border-fg">
            {t.shop.wallCta}
          </Link>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">{t.shop.wallNote}</p>
      </div>
      <ul className="border-t border-line/15">
        {t.shop.wallKinds.map((k) => (
          <li key={k} className="border-b border-line/15 py-4 font-serif text-xl sm:text-2xl">
            {k}
          </li>
        ))}
      </ul>
      {products.length > 0 && (
        <ul className="grid grid-cols-2 gap-5 md:col-span-2 md:grid-cols-4">
          {products.slice(0, 8).map((p) => (
            <li key={p.slug}>
              <ProductCard product={p} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Dolls sit on a shelf: a calm grid of square photos. */
export function ProductGrid({ products, aspect = "aspect-square" }: { products: Product[]; aspect?: string }) {
  return (
    <ul className="grid grid-cols-2 gap-x-5 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <li key={p.slug}>
          <ProductCard product={p} aspect={aspect} sizes="(min-width: 1024px) 22vw, (min-width: 768px) 30vw, 46vw" />
        </li>
      ))}
    </ul>
  );
}
