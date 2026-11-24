"use client";

import { useMemo, useState } from "react";
import { useBag } from "@/components/bag/bag-context";
import { CustomOrderDrawer } from "@/components/custom/custom-order";
import { useC } from "@/lib/i18n/collection";
import { useT } from "@/lib/i18n/client";
import { formatSar, fromPrice, WALL_DESIGNS, type Product, type WallGroup } from "@/lib/shop/catalog";

type Tab = "all" | WallGroup;
const TABS: Tab[] = ["all", "originals", "saudi-clubs", "global-clubs", "flags", "anime"];

type Card = { kind: "product"; group: WallGroup; product: Product } | { kind: "design"; group: WallGroup; en: string; ar: string };

/**
 * Wall hangings gallery: filter tabs over every design. Our own originals are sold as shown.
 * Flags, clubs and characters are a showcase archive: no price and no cart, only a request for a
 * custom piece (clubs and characters are listed by name, without their logos or artwork).
 */
export function WallHub({ products }: { products: Product[] }) {
  const { bi, locale } = useT();
  const c = useC();
  const { add } = useBag();
  const [tab, setTab] = useState<Tab>("all");
  const [custom, setCustom] = useState<string | null>(null);
  const [added, setAdded] = useState<string | null>(null);

  const cards = useMemo<Card[]>(
    () => [
      ...[...products].sort((a, b) => Number(!!a.showcase) - Number(!!b.showcase)).map((p): Card => ({ kind: "product", group: p.group ?? "originals", product: p })),
      ...WALL_DESIGNS.map((d): Card => ({ kind: "design", ...d })),
    ],
    [products],
  );
  const shown = cards.filter((k) => tab === "all" || k.group === tab);
  const count = (t: Tab) => cards.filter((k) => t === "all" || k.group === t).length;

  return (
    <>
      <div role="tablist" aria-label={c.hub.title} className="-mx-5 mb-8 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            type="button"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`inline-flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-sm border px-4 text-sm transition-colors ${tab === t ? "border-fg bg-fg text-bg" : "border-line/20 hover:border-fg"}`}
          >
            {c.hub.tabs[t]}
            <span className={`text-xs tabular-nums ${tab === t ? "text-bg/70" : "text-muted-foreground"}`}>{count(t).toLocaleString(locale === "ar" ? "ar-SA" : "en")}</span>
          </button>
        ))}
        <button type="button" onClick={() => setCustom("")} className="ms-auto inline-flex min-h-11 shrink-0 items-center rounded-sm bg-primary px-5 text-sm font-medium text-primary-fg hover:opacity-90">
          {c.hub.customize}
        </button>
      </div>

      <ul className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
        {shown.map((k) => {
          const id = k.kind === "product" ? k.product.slug : `${k.group}-${k.en}`;
          const name = k.kind === "product" ? bi(k.product.title) : locale === "ar" ? k.ar : k.en;
          const prefix = k.group === "anime" ? "char" : k.group === "flags" ? "flag" : k.group === "originals" ? "orig" : "club";
          return (
            <li key={id} className="flex flex-col">
              {k.kind === "product" ? (
                <div className="relative aspect-[4/3] overflow-hidden rounded-sm bg-surface">
                  {/* eslint-disable-next-line @next/next/no-img-element -- local photo */}
                  <img src={k.product.photos[0].src} alt={bi(k.product.photos[0].alt)} loading="lazy" className="h-full w-full object-cover drop-shadow-[0_14px_14px_rgba(60,30,10,0.18)]" />
                </div>
              ) : (
                <div className="relative flex aspect-[4/3] flex-col items-center justify-center overflow-hidden rounded-sm border border-line/10 bg-surface px-4 text-center">
                  <span aria-hidden="true" className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='8' height='8'><path d='M0 4h4M4 0v4' stroke='%2326211E' stroke-width='1.4'/></svg>\")" }} />
                  <span className="relative text-xs uppercase tracking-[0.2em] text-muted-foreground">{c.hub.tabs[k.group]}</span>
                  <span className="relative mt-2 font-serif text-2xl leading-tight sm:text-3xl">{name}</span>
                  <span className="relative mt-2 text-xs text-muted-foreground">{c.hub.byRequest}</span>
                </div>
              )}
              {(() => {
                const forSale = k.kind === "product" && !k.product.showcase;
                return (
                  <>
                    <div className="mt-3 flex items-baseline justify-between gap-2">
                      <h3 className="font-serif text-base leading-snug sm:text-lg">{k.kind === "product" ? name : c.hub.designOf(name)}</h3>
                      {forSale && <span className="shrink-0 text-sm tabular-nums text-muted-foreground">{formatSar(fromPrice(k.product), locale)}</span>}
                    </div>
                    {!forSale && (
                      <p className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-sm bg-surface px-2 py-0.5 text-xs text-muted-foreground">
                        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-terracotta" />
                        {c.hub.showcase}
                      </p>
                    )}
                    <div className="mt-3 grid gap-2">
                      {forSale && (
                        <button
                          type="button"
                          onClick={() => add({ slug: k.product.slug, color: k.product.colors[0].id, size: k.product.sizes[0].id }) && setAdded(k.product.slug)}
                          className={`min-h-11 rounded-sm px-3 text-sm font-medium transition-colors ${added === k.product.slug ? "bg-sage text-white" : "bg-primary text-primary-fg hover:opacity-90"}`}
                        >
                          {added === k.product.slug ? c.added : c.hub.orderShown}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setCustom(`${prefix}:${k.kind === "product" ? name : locale === "ar" ? k.ar : k.en}`)}
                        className={forSale ? "min-h-11 rounded-sm border border-fg/25 px-3 text-sm hover:border-fg" : "min-h-11 rounded-sm bg-primary px-3 text-sm font-medium text-primary-fg hover:opacity-90"}
                      >
                        {forSale ? c.hub.customize : c.hub.request}
                      </button>
                    </div>
                  </>
                );
              })()}
            </li>
          );
        })}
      </ul>
      <CustomOrderDrawer open={custom !== null} onClose={() => setCustom(null)} kind="wall" preset={custom ?? ""} />
    </>
  );
}
