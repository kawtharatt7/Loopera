import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteHeader } from "@/components/layout/site-header";
import { CheckoutForm } from "@/components/shop/checkout-form";
import { DICT } from "@/lib/i18n/dict";
import { getLocale } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: DICT[await getLocale()].checkout.title };
}

export default async function Page() {
  const t = DICT[await getLocale()];
  return (
    <>
      <SiteHeader />
      <main id="main" className="px-5 pb-24 pt-32 sm:px-8 sm:pt-28">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-4xl sm:text-5xl">{t.checkout.title}</h1>
          <div className="mt-10">
            <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-surface" />}>
              <CheckoutForm />
            </Suspense>
          </div>
        </div>
      </main>
    </>
  );
}
