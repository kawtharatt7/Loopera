"use client";

import type { ReactNode } from "react";
import { useC } from "@/lib/i18n/collection";
import { useT } from "@/lib/i18n/client";
import { byCategory, CATEGORIES, type Category } from "@/lib/shop/catalog";
import { BagsGrid } from "./bags-grid";
import { ClothesLooks } from "./clothes-looks";
import { Gifts } from "./gifts";
import { WallHub } from "./wall-hub";

function Section({ id, title, sub, children }: { id: string; title: string; sub?: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-32 border-t border-line/10 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <h2 id={`${id}-h`} className="max-w-3xl text-balance text-4xl sm:text-5xl">
          {title}
        </h2>
        {sub && <p className="mt-3 max-w-xl text-muted-foreground">{sub}</p>}
        <div className="mt-10">{children}</div>
      </div>
    </section>
  );
}

/** Every shopping section, in order: clothes, bags, wall hangings, dolls and bouquets. */
export function CollectionSections() {
  const c = useC();
  return (
    <>
      <Section id="clothes" title={c.clothes.title} sub={c.clothes.sub}>
        <ClothesLooks products={byCategory("clothes")} />
      </Section>
      <Section id="bags" title={c.bags.title} sub={c.bags.sub}>
        <BagsGrid bags={byCategory("bags")} />
      </Section>
      <Section id="wall" title={c.hub.title} sub={c.hub.sub}>
        <WallHub products={byCategory("wall")} />
      </Section>
      <Section id="dolls" title={c.gifts.title} sub={c.gifts.sub}>
        <Gifts dolls={byCategory("dolls")} bouquets={byCategory("flowers")} />
      </Section>
    </>
  );
}

/** The section ids the store's sticky tabs point at. */
export const SECTION_IDS: { id: string; cat: Category }[] = [
  { id: "clothes", cat: "clothes" },
  { id: "bags", cat: "bags" },
  { id: "wall", cat: "wall" },
  { id: "dolls", cat: "dolls" },
];

export function useSectionLabel() {
  const { bi } = useT();
  const c = useC();
  return (cat: Category) => (cat === "dolls" ? c.gifts.title : bi(CATEGORIES.find((x) => x.id === cat)!.label));
}
