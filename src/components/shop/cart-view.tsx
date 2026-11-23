"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n/client";
import { formatSar, getProduct, stockFor } from "@/lib/shop/catalog";
import { cartTotal, priceOf, setQty, useCart } from "@/lib/shop/cart";
import { PieceImage } from "./piece-image";

export function CartView() {
  const lines = useCart();
  const { t, bi, locale } = useT();
  if (lines.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-2xl">{t.bag.empty}</p>
        <Link href="/shop" className="mt-6 inline-flex h-12 items-center rounded-lg bg-primary px-6 text-primary-fg">
          {t.checkout.findSomething}
        </Link>
      </div>
    );
  }
  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_320px]">
      <ul className="divide-y divide-line/10">
        {lines.map((l, i) => {
          const p = getProduct(l.slug);
          if (!p) return null;
          const max = stockFor(p, l.color, l.size);
          const color = p.colors.find((c) => c.id === l.color);
          const size = p.sizes.find((s) => s.id === l.size);
          return (
            <li key={`${l.slug}-${l.color}-${l.size}`} className="flex gap-4 py-5">
              <Link href={`/shop/${p.slug}`} className="relative h-28 w-24 shrink-0 overflow-hidden rounded-md bg-surface">
                <PieceImage product={p} sizes="96px" />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex justify-between gap-4">
                  <Link href={`/shop/${p.slug}`} className="font-medium hover:underline">
                    {bi(p.title)}
                  </Link>
                  <span className="tabular-nums">{formatSar(priceOf(l) * l.qty, locale)}</span>
                </div>
                <p className="text-sm text-muted-foreground">{[color && bi(color.name), size && bi(size.label), bi(p.maker)].filter(Boolean).join(locale === "ar" ? "، " : ", ")}</p>
                <div className="mt-auto flex items-center gap-3 pt-3">
                  <div className="flex items-center rounded-lg border border-line/20">
                    <button type="button" aria-label={t.bag.fewer} onClick={() => setQty(i, l.qty - 1)} className="h-10 w-10">
                      −
                    </button>
                    <span className="w-8 text-center tabular-nums" aria-live="polite">
                      {l.qty}
                    </span>
                    <button type="button" aria-label={t.bag.more} disabled={l.qty >= max} onClick={() => setQty(i, l.qty + 1)} className="h-10 w-10 disabled:opacity-40">
                      +
                    </button>
                  </div>
                  <button type="button" onClick={() => setQty(i, 0)} className="text-sm underline underline-offset-4">
                    {t.bag.remove}
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <aside className="h-fit rounded-xl bg-surface p-6">
        <div className="flex justify-between text-lg">
          <span>{t.checkout.total}</span>
          <span className="tabular-nums">{formatSar(cartTotal(lines), locale)}</span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{t.checkout.freeShipping}</p>
        <Link href="/checkout" className="mt-6 flex h-12 w-full items-center justify-center rounded-lg bg-primary font-medium text-primary-fg">
          {t.bag.checkout}
        </Link>
      </aside>
    </div>
  );
}
