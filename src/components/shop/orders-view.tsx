"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { formatSar } from "@/lib/demo/products";
import { useOrders, type Order } from "@/lib/shop/cart";

const STATUS_LABEL: Record<Order["status"], string> = {
  pending: "Waiting for payment",
  paid: "Paid, sent to the maker",
  in_progress: "Being crocheted",
  shipped: "On its way",
  delivered: "Delivered",
  cancelled: "Cancelled",
};
const STEPS: Order["status"][] = ["paid", "in_progress", "shipped", "delivered"];

const date = (iso: string) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));

export function OrdersList() {
  const orders = useOrders();
  if (orders.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-2xl">No orders yet.</p>
        <Link href="/shop" className="mt-4 inline-block underline underline-offset-4">
          Browse the shop
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
              <span className="font-medium">{o.id}</span>
              <span className="block text-sm text-muted-foreground">
                {date(o.createdAt)}, {o.lines.length} {o.lines.length === 1 ? "piece" : "pieces"}
              </span>
            </span>
            <span className="text-right">
              <span className="tabular-nums">{formatSar(o.total)}</span>
              <span className="block text-sm text-muted-foreground">{STATUS_LABEL[o.status]}</span>
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
  const order = orders.find((o) => o.id === id);
  if (!order) {
    return (
      <div className="py-20 text-center">
        <p className="text-2xl">We could not find that order on this device.</p>
        <Link href="/orders" className="mt-4 inline-block underline underline-offset-4">
          See your orders
        </Link>
      </div>
    );
  }
  const step = STEPS.indexOf(order.status);
  return (
    <div>
      {params.get("new") && (
        <p role="status" className="mb-8 rounded-xl bg-surface px-5 py-4 text-lg">
          Thank you, {order.name.split(" ")[0]}. Your order is paid (test mode) and the makers have been told.
        </p>
      )}
      <h1 className="text-4xl sm:text-5xl">Order {order.id}</h1>
      <p className="mt-2 text-muted-foreground">
        Placed {date(order.createdAt)}, paid with {order.cardBrand} ending {order.cardLast4}
        {order.testPayment ? " (test)" : ""}, shipping to {order.city}.
      </p>

      <ol className="mt-10 grid grid-cols-4 gap-2" aria-label="Order progress">
        {STEPS.map((s, i) => (
          <li key={s}>
            <div className={`h-1.5 rounded-full ${i <= step ? "bg-peach" : "bg-surface-2"}`} />
            <p className={`mt-2 text-sm ${i <= step ? "" : "text-muted-foreground"}`} aria-current={i === step ? "step" : undefined}>
              {STATUS_LABEL[s]}
            </p>
          </li>
        ))}
      </ol>

      <ul className="mt-10 divide-y divide-line/10">
        {order.lines.map((l) => (
          <li key={`${l.slug}-${l.color}-${l.size}`} className="flex justify-between gap-4 py-4">
            <span>
              <Link href={`/shop/${l.slug}`} className="hover:underline">
                {l.title}
              </Link>
              <span className="block text-sm text-muted-foreground">
                {l.color}, {l.size}, × {l.qty}, by {l.maker}
              </span>
            </span>
            <span className="tabular-nums">{formatSar(l.unitPrice * l.qty)}</span>
          </li>
        ))}
      </ul>
      <div className="flex justify-between border-t border-line/20 pt-4 text-lg">
        <span>Total</span>
        <span className="tabular-nums">{formatSar(order.total)}</span>
      </div>
    </div>
  );
}
