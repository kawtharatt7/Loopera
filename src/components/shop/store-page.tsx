"use client";

import { useEffect, useState, type ReactNode } from "react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { useT } from "@/lib/i18n/client";
import { byCategory, CATEGORIES, type Category } from "@/lib/shop/catalog";
import { BagsHero } from "./bags-hero";
import { ClothesEdit } from "./clothes-edit";
import { CardRow } from "./product-card";
import { WallPreview } from "./wall-preview";

function Section({ id, title, blurb, children, bleed = false }: { id: Category; title: string; blurb?: string; children: ReactNode; bleed?: boolean }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-32 border-t border-line/10 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <h2 id={`${id}-h`} className="max-w-3xl text-balance text-4xl sm:text-5xl">
          {title}
        </h2>
        {blurb && <p className="mt-3 max-w-xl text-muted-foreground">{blurb}</p>}
      </div>
      <div className={bleed ? "mt-10" : "mx-auto mt-10 max-w-7xl px-5 sm:px-8"}>{children}</div>
    </section>
  );
}

/** The store: one section per kind of piece, each with its own way of showing things. */
export function StorePage() {
  const { t, bi } = useT();
  const [current, setCurrent] = useState<Category>("clothes");

  // Highlights the tab of the section in view.
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setCurrent(e.target.id as Category)),
      { rootMargin: "-45% 0px -50% 0px" },
    );
    CATEGORIES.forEach((c) => {
      const el = document.getElementById(c.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  const label = (c: Category) => bi(CATEGORIES.find((x) => x.id === c)!.label);
  const blurb = (c: Category) => bi(CATEGORIES.find((x) => x.id === c)!.blurb);

  return (
    <>
      <SiteHeader />
      <main id="main" className="pt-28 sm:pt-20">
        <div className="mx-auto max-w-7xl px-5 pb-6 pt-8 sm:px-8 sm:pt-14">
          <h1 className="text-5xl sm:text-7xl">{t.shop.title}</h1>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground">{t.shop.intro}</p>
        </div>

        <nav aria-label={t.shop.title} className="sticky top-[6.75rem] z-40 border-y border-line/10 bg-bg/85 backdrop-blur-md sm:top-16">
          <ul className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-3 sm:px-6 [scrollbar-width:none]">
            {CATEGORIES.map((c) => (
              <li key={c.id}>
                <a
                  href={`#${c.id}`}
                  aria-current={current === c.id ? "true" : undefined}
                  className={`inline-flex min-h-12 items-center whitespace-nowrap border-b-2 px-4 text-[15px] transition-colors ${current === c.id ? "border-peach text-fg" : "border-transparent text-muted-foreground hover:text-fg"}`}
                >
                  {bi(c.label)}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <Section id="clothes" title={t.shop.clothesHeadline}>
          <ClothesEdit products={byCategory("clothes")} />
        </Section>

        <Section id="bags" title={label("bags")} blurb={blurb("bags")} bleed>
          <BagsHero bags={byCategory("bags")} mode="collection" collectionTitle={label("bags")} collectionBlurb={blurb("bags")} />
          <div className="mx-auto mt-10 max-w-7xl px-5 sm:px-8">
            <CardRow products={byCategory("bags")} />
          </div>
        </Section>

        <Section id="wall" title={t.shop.wallHeadline}>
          <WallPreview products={byCategory("wall")} />
        </Section>

        <Section id="toys" title={t.shop.toysHeadline}>
          <CardRow products={byCategory("toys")} />
        </Section>

        <Section id="flowers" title={t.shop.flowersHeadline}>
          <CardRow products={byCategory("flowers")} />
        </Section>

        <Section id="home" title={t.shop.homeHeadline}>
          <CardRow products={byCategory("home")} />
        </Section>

        <p className="mx-auto max-w-7xl px-5 pb-10 text-xs text-muted-foreground sm:px-8">{t.shop.credits}</p>
      </main>
      <SiteFooter />
    </>
  );
}
