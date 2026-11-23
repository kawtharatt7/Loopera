import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteHeader } from "@/components/layout/site-header";
import { CartView } from "@/components/shop/cart-view";

export const metadata: Metadata = { title: "Cart" };

export default function Page() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="px-5 pb-24 pt-28 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-4xl sm:text-5xl">Your cart</h1>
          <div className="mt-10">
            <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-surface" />}>
              <CartView />
            </Suspense>
          </div>
        </div>
      </main>
    </>
  );
}
