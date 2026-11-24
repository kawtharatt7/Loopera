"use client";

import { useMemo, useState } from "react";
import { useBag } from "@/components/bag/bag-context";
import { CustomOrderDrawer } from "@/components/custom/custom-order";
import { useC } from "@/lib/i18n/collection";
import { useT } from "@/lib/i18n/client";
import { formatSar, fromPrice, type Product, type WallGroup } from "@/lib/shop/catalog";

const GROUPS: ("all" | WallGroup)[] = ["all", "originals", "saudi-clubs", "global-clubs", "anime"];

/**
 * Wall hangings as a gallery wall: tapestries in thin frames under soft light, in a staggered layout.
 * Our originals can be ordered as shown or used as the start of a custom design; showcase pieces are
 * shown only, with no price, and lead to a custom request.
 */
export function WallHub({ products, walk = true }: { products: Product[]; walk?: boolean }) {
  const { bi, locale } = useT();
  const c = useC();
  const { add } = useBag();
  const [group, setGroup] = useState<"all" | WallGroup>("all");
  const [custom, setCustom] = useState<string | null>(null);
  const [added, setAdded] = useState<string | null>(null);
  const shown = useMemo(() => (group === "all" ? products : products.filter((p) => p.group === group)), [group, products]);
  const groups = GROUPS.filter((g) => g === "all" || products.some((p) => p.group === g));

  return (
    <>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div role="tablist" aria-label={c.hub.title} className="flex flex-wrap gap-2">
          {groups.map((g) => (
            <button
              key={g}
              type="button"
              role="tab"
              aria-selected={group === g}
              onClick={() => setGroup(g)}
              className={`min-h-10 rounded-full px-4 text-sm transition-colors duration-500 ${group === g ? "bg-fg text-bg" : "border border-fg/20 text-fg/80 hover:border-fg/60"}`}
            >
              {c.hub.tabs[g]}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          {walk && (
            <a href="/shop/wall" className="inline-flex min-h-10 items-center rounded-full border border-fg/30 px-5 text-sm transition-colors duration-500 hover:border-fg">
              {c.hub.walk}
            </a>
          )}
          <button type="button" onClick={() => setCustom("")} className="inline-flex min-h-10 items-center rounded-full bg-fg px-5 text-sm font-medium text-bg hover:opacity-90">
            {c.hub.customize}
          </button>
        </div>
      </div>

      <ul className="columns-2 gap-x-6 md:columns-3 lg:columns-4 [&>li]:mb-12 [&>li]:break-inside-avoid">
        {shown.map((p) => (
          <li key={p.slug} className="flex flex-col">
            <div className="relative">
              <span aria-hidden="true" className="pointer-events-none absolute -inset-x-4 -top-6 h-24" style={{ background: "radial-gradient(50% 60% at 50% 0%, rgb(255 236 210 / 0.3), transparent 70%)" }} />
              <div className="relative border border-line/10 bg-surface p-3 shadow-[0_24px_40px_-26px_rgba(30,20,10,0.55)] transition-transform duration-700 ease-out hover:-translate-y-1 sm:p-4">
                {/* eslint-disable-next-line @next/next/no-img-element -- local photo */}
                <img src={p.photos[0].src} alt={bi(p.photos[0].alt)} loading="lazy" className="block w-full" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between gap-2">
              <h3 className="font-serif text-base leading-snug sm:text-lg">{bi(p.title)}</h3>
              {!p.showcase && <span className="shrink-0 text-sm tabular-nums text-muted-foreground">{formatSar(fromPrice(p), locale)}</span>}
            </div>
            {p.showcase ? (
              <>
                <p className="mt-1 text-xs tracking-wide text-muted-foreground">{c.hub.showcase}</p>
                <button type="button" onClick={() => setCustom(`${p.group === "anime" ? "char" : "club"}:${bi(p.title)}`)} className="mt-3 min-h-10 rounded-full border border-fg/20 px-3 text-xs transition-colors duration-500 hover:border-fg">
                  {c.hub.request}
                </button>
              </>
            ) : (
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
            )}
          </li>
        ))}
      </ul>
      <CustomOrderDrawer open={custom !== null} onClose={() => setCustom(null)} kind="wall" preset={custom ?? ""} />
    </>
  );
}
