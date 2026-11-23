"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useT } from "@/lib/i18n/client";
import { formatSar, getProduct } from "@/lib/shop/catalog";
import { useOrders, type Order } from "@/lib/shop/cart";

const STEPS: Order["status"][] = ["paid", "in_progress", "shipped", "delivered"];

function useDate() {
  const { locale } = useT();
  return (iso: string) => new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));
}

export function OrdersList() {
  const orders = useOrders();
  const { t, locale } = useT();
  const date = useDate();
  if (orders.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-2xl">{t.orders.none}</p>
        <Link href="/shop" className="mt-4 inline-block underline underline-offset-4">
          {t.checkout.findSomething}
        </Link>
      </div>
    );
  }
  return (
    <ul className="divide-y divide-line/10">
      {orders.map((o) => (
        <li key={o.id}>
          <Link href={`/orders/${o.id}`} className="flex items-center justify-between gap-4 py-5 hover:bg-surface/40">
            <span>
              <span className="font-medium" dir="ltr">
                {o.id}
              </span>
              <span className="block text-sm text-muted-foreground">
                {date(o.createdAt)}{locale === "ar" ? "، " : ", "}{t.orders.pieces(o.lines.reduce((a, l) => a + l.qty, 0))}
              </span>
            </span>
            <span className="text-end">
              <span className="tabular-nums">{formatSar(o.total, locale)}</span>
              <span className="block text-sm text-muted-foreground">{t.orders.status[o.status]}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function OrderDetail({ id }: { id: string }) {
  const orders = useOrders();
  const params = useSearchParams();
  const { t, bi, locale } = useT();
  const date = useDate();
  const order = orders.find((o) => o.id === id);
  if (!order) {
    return (
      <div className="py-20 text-center">
        <p className="text-2xl">{t.orders.notFound}</p>
        <Link href="/orders" className="mt-4 inline-block underline underline-offset-4">
          {t.orders.title}
        </Link>
      </div>
    );
  }
  const step = STEPS.indexOf(order.status);
  return (
    <div>
      {params.get("new") && (
        <p role="status" className="mb-8 rounded-xl bg-surface px-5 py-4 text-lg">
          {t.orders.thanks(order.name.split(" ")[0])}
        </p>
      )}
      <h1 className="text-4xl sm:text-5xl">{t.orders.order(order.id)}</h1>
      <p className="mt-2 text-muted-foreground">{t.orders.placed(date(order.createdAt), order.cardBrand, order.cardLast4, order.city)}</p>
      <ol className="mt-10 grid grid-cols-4 gap-2" aria-label={t.orders.title}>
        {STEPS.map((s, i) => (
          <li key={s}>
            <div className={`h-1.5 rounded-full ${i <= step ? "bg-peach" : "bg-surface-2"}`} />
            <p className={`mt-2 text-sm ${i <= step ? "" : "text-muted-foreground"}`} aria-current={i === step ? "step" : undefined}>
              {t.orders.status[s]}
            </p>
          </li>
        ))}
      </ol>
      <ul className="mt-10 divide-y divide-line/10">
        {order.lines.map((l) => {
          const p = getProduct(l.slug);
          const color = p?.colors.find((c) => c.id === l.color);
          const size = p?.sizes.find((s) => s.id === l.size);
          return (
            <li key={`${l.slug}-${l.color}-${l.size}`} className="flex justify-between gap-4 py-4">
              <span>
                <Link href={`/shop/${l.slug}`} className="hover:underline">
                  {p ? bi(p.title) : l.slug}
                </Link>
                <span className="block text-sm text-muted-foreground">
                  {[color && bi(color.name), size && bi(size.label), `× ${l.qty}`, p && t.common.by(bi(p.maker))].filter(Boolean).join(locale === "ar" ? "، " : ", ")}
                </span>
              </span>
              <span className="tabular-nums">{formatSar(l.unitPrice * l.qty, locale)}</span>
            </li>
          );
        })}
      </ul>
      <div className="flex justify-between border-t border-line/20 pt-4 text-lg">
        <span>{t.checkout.total}</span>
        <span className="tabular-nums">{formatSar(order.total, locale)}</span>
      </div>
    </div>
  );
}
