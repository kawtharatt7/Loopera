import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { ShopGrid } from "@/components/shop/shop-grid";

export const metadata: Metadata = { title: "Shop" };

export default function ShopPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="px-5 pb-24 pt-28 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-5xl sm:text-6xl">The shop</h1>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground">Clothes, bags, toys and flowers, each one crocheted by hand. Pick a piece to choose its color and size.</p>
          <div className="mt-10">
            <ShopGrid />
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
