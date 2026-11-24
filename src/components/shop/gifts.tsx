"use client";

import { useState } from "react";
import { useBag } from "@/components/bag/bag-context";
import { CustomOrderDrawer, type CustomKind } from "@/components/custom/custom-order";
import { useC } from "@/lib/i18n/collection";
import { useT } from "@/lib/i18n/client";
import { formatSar, fromPrice, type Product } from "@/lib/shop/catalog";

/** Dolls and bouquets: each card can be ordered as shown, or customised in a drawer. */
export function Gifts({ dolls, bouquets }: { dolls: Product[]; bouquets: Product[] }) {
  const c = useC();
  const [custom, setCustom] = useState<{ kind: CustomKind; preset: string } | null>(null);

  return (
    <>
      <div className="grid gap-14">
        <Group title={c.gifts.dolls} items={dolls} kind="doll" onCustom={(preset) => setCustom({ kind: "doll", preset })} />
        <Group title={c.gifts.bouquets} items={bouquets} kind="bouquet" onCustom={(preset) => setCustom({ kind: "bouquet", preset })} />
      </div>
      <CustomOrderDrawer open={custom !== null} onClose={() => setCustom(null)} kind={custom?.kind ?? "doll"} preset={custom?.preset ?? ""} />
    </>
  );
}

function Group({ title, items, kind, onCustom }: { title: string; items: Product[]; kind: "doll" | "bouquet"; onCustom: (preset: string) => void }) {
  const { bi, locale } = useT();
  const c = useC();
  const { add } = useBag();
  const [added, setAdded] = useState<string | null>(null);
  return (
    <section aria-label={title}>
      <h3 className="mb-6 text-2xl">{title}</h3>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
        {items.map((p) => (
          <li key={p.slug} className="flex flex-col">
            <div className="relative flex aspect-[4/5] items-center justify-center overflow-hidden rounded-sm bg-surface">
              <span aria-hidden="true" className="absolute inset-0" style={{ background: "radial-gradient(80% 60% at 70% 15%, rgb(255 236 210 / 0.7), transparent 70%)" }} />
              {/* eslint-disable-next-line @next/next/no-img-element -- local cut-out */}
              <img src={p.cutout ?? p.photos[0].src} alt={bi(p.photos[0].alt)} loading="lazy" className="relative max-h-[80%] max-w-[78%] object-contain drop-shadow-[0_18px_16px_rgba(60,30,10,0.22)]" />
            </div>
            <div className="mt-3 flex items-baseline justify-between gap-3">
              <h4 className="font-serif text-lg leading-snug">{bi(p.title)}</h4>
              {!p.showcase && <span className="shrink-0 text-sm tabular-nums text-muted-foreground">{formatSar(fromPrice(p), locale)}</span>}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{p.showcase ? c.hub.showcase : c.readyIn(p.leadTimeDays)}</p>
            {p.showcase ? (
              <button type="button" onClick={() => onCustom("")} className="mt-3 min-h-11 rounded-sm border border-fg/25 px-3 text-sm hover:border-fg">
                {c.hub.request}
              </button>
            ) : (
            <div className="mt-3 grid gap-2">
              <button
                type="button"
                onClick={() => add({ slug: p.slug, color: p.colors[0].id, size: p.sizes[0].id }) && setAdded(p.slug)}
                className={`min-h-11 rounded-sm px-3 text-sm font-medium transition-colors ${added === p.slug ? "bg-sage text-white" : "bg-primary text-primary-fg hover:opacity-90"}`}
              >
                {added === p.slug ? c.added : c.gifts.orderReady}
              </button>
              <button type="button" onClick={() => onCustom(kind === "doll" && p.slug.startsWith("graduate") ? "graduation" : "")} className="min-h-11 rounded-sm border border-fg/25 px-3 text-sm hover:border-fg">
                {c.gifts.customize}
              </button>
            </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
