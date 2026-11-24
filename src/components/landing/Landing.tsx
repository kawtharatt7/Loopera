"use client";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { CollectionSections } from "@/components/shop/collection";
import { useC } from "@/lib/i18n/collection";
import { ScrollHero } from "./scroll-hero";

/** Home: the scroll story, then every shopping section right below it ("Open Store" scrolls here). */
export function Landing() {
  const c = useC();
  return (
    <>
      <SiteHeader overlay />
      <main id="main">
        <ScrollHero />
        <div id="shop" className="scroll-mt-16">
          <div className="mx-auto max-w-7xl px-5 pt-16 sm:px-8 sm:pt-24">
            <h2 className="text-5xl sm:text-7xl">{c.shopTitle}</h2>
            <p className="mt-4 max-w-xl text-lg text-muted-foreground">{c.shopIntro}</p>
          </div>
          <CollectionSections />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
