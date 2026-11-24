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
            className={`inline-flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-4 text-sm transition-colors duration-500 ${tab === t ? "border-fg bg-fg text-bg" : "border-line/20 hover:border-fg"}`}
          >
            {c.hub.tabs[t]}
            <span className={`text-xs tabular-nums ${tab === t ? "text-bg/70" : "text-muted-foreground"}`}>{count(t).toLocaleString(locale === "ar" ? "ar-SA" : "en")}</span>
          </button>
        ))}
        <button type="button" onClick={() => setCustom("")} className="ms-auto inline-flex min-h-11 shrink-0 items-center rounded-full bg-fg px-5 text-sm font-medium text-bg hover:opacity-90">
          {c.hub.customize}
        </button>
      </div>

      <div className="mb-10 flex flex-wrap items-center justify-between gap-4 rounded-sm bg-surface px-6 py-5">
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">{c.hub.walkText}</p>
        <a href="/shop/wall" className="inline-flex min-h-11 items-center rounded-full border border-fg/30 px-6 text-sm hover:border-fg">
          {c.hub.walk}
        </a>
      </div>
      <ul className="columns-2 gap-x-6 md:columns-3 lg:columns-4 [&>li]:mb-10 [&>li]:break-inside-avoid">
        {shown.map((k) => {
          const id = k.kind === "product" ? k.product.slug : `${k.group}-${k.en}`;
          const name = k.kind === "product" ? bi(k.product.title) : locale === "ar" ? k.ar : k.en;
          const prefix = k.group === "anime" ? "char" : k.group === "flags" ? "flag" : k.group === "originals" ? "orig" : "club";
          return (
            <li key={id} className="flex flex-col">
              {k.kind === "product" ? (
                <div className="relative">
                  {/* gallery light above the frame */}
                  <span aria-hidden="true" className="pointer-events-none absolute -inset-x-4 -top-6 h-24" style={{ background: "radial-gradient(50% 60% at 50% 0%, rgb(255 236 210 / 0.35), transparent 70%)" }} />
                  <div className="relative border border-line/10 bg-bg p-3 shadow-[0_24px_40px_-26px_rgba(30,20,10,0.55)] transition-transform duration-700 ease-out hover:-translate-y-1 sm:p-4">
                    {/* eslint-disable-next-line @next/next/no-img-element -- local photo */}
                    <img src={k.product.photos[0].src} alt={bi(k.product.photos[0].alt)} loading="lazy" className="block w-full" />
                  </div>
                </div>
              ) : (
                <div className="relative flex aspect-[4/5] flex-col items-center justify-center border border-line/10 bg-bg px-4 text-center shadow-[0_24px_40px_-26px_rgba(30,20,10,0.55)]">
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
                          className={`min-h-10 rounded-full px-3 text-xs font-medium transition-colors duration-500 ${added === k.product.slug ? "bg-sage text-white" : "bg-fg text-bg hover:opacity-90"}`}
                        >
                          {added === k.product.slug ? c.added : c.hub.orderShown}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setCustom(`${prefix}:${k.kind === "product" ? name : locale === "ar" ? k.ar : k.en}`)}
                        className="min-h-10 rounded-full border border-fg/20 px-3 text-xs transition-colors duration-500 hover:border-fg"
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
