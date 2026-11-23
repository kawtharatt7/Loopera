"use client";

import Image from "next/image";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { formatSar, getProduct, stockFor } from "@/lib/demo/products";
import { cartTotal, priceOf, setQty, useCart } from "@/lib/shop/cart";

export function CartView() {
  const lines = useCart();
  if (lines.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-2xl">Your cart is empty.</p>
        <ButtonLink href="/shop" className="mt-6">
          Browse the shop
        </ButtonLink>
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
          return (
            <li key={`${l.slug}-${l.color}-${l.size}`} className="flex gap-4 py-5">
              <Link href={`/shop/${p.slug}`} className="relative h-28 w-24 shrink-0 overflow-hidden rounded-md bg-surface">
                <Image src={p.image.src} alt={p.image.alt} fill sizes="96px" className="object-cover" />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex justify-between gap-4">
                  <Link href={`/shop/${p.slug}`} className="font-medium hover:underline">
                    {p.title}
                  </Link>
                  <span className="tabular-nums">{formatSar(priceOf(l) * l.qty)}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {l.color}, {l.size}, by {p.maker}
                </p>
                <div className="mt-auto flex items-center gap-3 pt-3">
                  <div className="flex items-center rounded-lg bg-surface">
                    <button type="button" aria-label="One fewer" onClick={() => setQty(i, l.qty - 1)} className="h-10 w-10 cursor-pointer">
                      −
                    </button>
                    <span className="w-8 text-center tabular-nums" aria-live="polite">
                      {l.qty}
                    </span>
                    <button type="button" aria-label="One more" disabled={l.qty >= max} onClick={() => setQty(i, l.qty + 1)} className="h-10 w-10 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40">
                      +
                    </button>
                  </div>
                  <button type="button" onClick={() => setQty(i, 0)} className="text-sm underline underline-offset-4">
                    Remove
                  </button>
                  {l.qty >= max && <span className="text-sm text-muted-foreground">That is all we have in this color.</span>}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <aside className="h-fit rounded-2xl bg-surface p-6">
        <div className="flex justify-between text-lg">
          <span>Total</span>
          <span className="tabular-nums">{formatSar(cartTotal(lines))}</span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">Free shipping inside Saudi Arabia.</p>
        <ButtonLink href="/checkout" size="lg" className="mt-6 w-full">
          Check out
        </ButtonLink>
      </aside>
    </div>
  );
}
