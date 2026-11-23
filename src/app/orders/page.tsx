import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteHeader } from "@/components/layout/site-header";
import { OrdersList } from "@/components/shop/orders-view";

export const metadata: Metadata = { title: "Orders" };

export default function Page() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="px-5 pb-24 pt-28 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-4xl sm:text-5xl">Your orders</h1>
          <div className="mt-10">
            <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-surface" />}>
              <OrdersList />
            </Suspense>
          </div>
        </div>
      </main>
    </>
  );
}
