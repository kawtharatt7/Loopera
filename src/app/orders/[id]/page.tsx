import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteHeader } from "@/components/layout/site-header";
import { OrderDetail } from "@/components/shop/orders-view";

export const metadata: Metadata = { title: "Order" };

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <SiteHeader />
      <main id="main" className="px-5 pb-24 pt-28 sm:px-8">
        <div className="mx-auto max-w-4xl">
          <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-surface" />}>
            <OrderDetail id={id} />
          </Suspense>
        </div>
      </main>
    </>
  );
}
