"use client";

import { useState } from "react";
import { useBag } from "@/components/bag/bag-context";
import { CustomOrderDrawer } from "@/components/custom/custom-order";
import { useC } from "@/lib/i18n/collection";
import { useT } from "@/lib/i18n/client";
import { formatSar, fromPrice, type Product } from "@/lib/shop/catalog";

/**
 * Wall hangings as a gallery wall: our own tapestries in thin frames under soft light, in a
 * staggered layout. Each can be ordered as shown or used as the start of a custom design.
 */
export function WallHub({ products }: { products: Product[] }) {
  const { bi, locale } = useT();
  const c = useC();
  const { add } = useBag();
  const [custom, setCustom] = useState<string | null>(null);
  const [added, setAdded] = useState<string | null>(null);

  return (
    <>
      <div className="mb-10 flex flex-wrap items-center justify-between gap-4 rounded-sm bg-surface px-6 py-5">
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">{c.hub.walkText}</p>
        <div className="flex flex-wrap gap-3">
          <a href="/shop/wall" className="inline-flex min-h-11 items-center rounded-full border border-fg/30 px-6 text-sm transition-colors duration-500 hover:border-fg">
            {c.hub.walk}
          </a>
          <button type="button" onClick={() => setCustom("")} className="inline-flex min-h-11 items-center rounded-full bg-fg px-6 text-sm font-medium text-bg hover:opacity-90">
            {c.hub.customize}
          </button>
        </div>
      </div>

      <ul className="columns-2 gap-x-6 md:columns-3 lg:columns-4 [&>li]:mb-12 [&>li]:break-inside-avoid">
        {products.map((p) => (
          <li key={p.slug} className="flex flex-col">
            <div className="relative">
              <span aria-hidden="true" className="pointer-events-none absolute -inset-x-4 -top-6 h-24" style={{ background: "radial-gradient(50% 60% at 50% 0%, rgb(255 236 210 / 0.35), transparent 70%)" }} />
              <div className="relative border border-line/10 bg-bg p-3 shadow-[0_24px_40px_-26px_rgba(30,20,10,0.55)] transition-transform duration-700 ease-out hover:-translate-y-1 sm:p-4">
                {/* eslint-disable-next-line @next/next/no-img-element -- local photo */}
                <img src={p.photos[0].src} alt={bi(p.photos[0].alt)} loading="lazy" className="block w-full" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between gap-2">
              <h3 className="font-serif text-base leading-snug sm:text-lg">{bi(p.title)}</h3>
              <span className="shrink-0 text-sm tabular-nums text-muted-foreground">{formatSar(fromPrice(p), locale)}</span>
            </div>
            <div className="mt-3 grid gap-2">
              <button
                type="button"
                onClick={() => add({ slug: p.slug, color: p.colors[0].id, size: p.sizes[0].id }) && setAdded(p.slug)}
                className={`min-h-10 rounded-full px-3 text-xs font-medium transition-colors duration-500 ${added === p.slug ? "bg-sage text-white" : "bg-fg text-bg hover:opacity-90"}`}
              >
                {added === p.slug ? c.added : c.hub.orderShown}
              </button>
              <button type="button" onClick={() => setCustom(`orig:${bi(p.title)}`)} className="min-h-10 rounded-full border border-fg/20 px-3 text-xs transition-colors duration-500 hover:border-fg">
                {c.hub.customize}
              </button>
            </div>
          </li>
        ))}
      </ul>
      <CustomOrderDrawer open={custom !== null} onClose={() => setCustom(null)} kind="wall" preset={custom ?? ""} />
    </>
  );
}
