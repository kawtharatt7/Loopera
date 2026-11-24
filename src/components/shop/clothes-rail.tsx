"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ClothingRailHero, type RailGarment } from "@/components/ui/product-rail-gallery";
import { useT } from "@/lib/i18n/client";
import { formatSar, fromPrice, type Product } from "@/lib/shop/catalog";

/** Cut-outs of the clothes whose catalog entry shows the studio photo instead. */
const CUTOUTS: Record<string, string> = { "cream-cherry-vest": "/photos/cutout/cream-cherry-vest-u2.webp" };

/**
 * Clothes hang on a rail (ClothingRailHero from 21st.dev). Every garment is one of our own pieces,
 * cut out of its photo; the hang tag carries the price. Clicking a piece lifts it off the rail.
 */
export function ClothesRail({ products }: { products: Product[] }) {
  const { t, bi, locale } = useT();
  const [picked, setPicked] = useState(0);
  const wrap = useRef<HTMLDivElement | null>(null);

  // The rail marks the garment turned to the front in data-active; the button below follows it.
  useEffect(() => {
    const section = wrap.current?.querySelector("[data-slot='clothing-rail-hero']");
    if (!section) return;
    const read = () => {
      const v = section.getAttribute("data-active");
      if (v) setPicked(Number(v));
    };
    const mo = new MutationObserver(read);
    mo.observe(section, { attributes: true, attributeFilter: ["data-active"] });
    return () => mo.disconnect();
  }, []);
  const items = useMemo<RailGarment[]>(
    () =>
      products.map((p) => ({
        id: p.slug,
        name: bi(p.title),
        description: bi(p.description),
        image: p.cutout ?? CUTOUTS[p.slug] ?? `/photos/cutout/${p.slug}.webp`,
        tag: formatSar(fromPrice(p), locale),
        details: p.details.map((d) => bi(d)),
      })),
    [products, bi, locale],
  );
  const current = products[picked] ?? products[0];

  return (
    <div ref={wrap} className="loopera-rail">
      <ClothingRailHero
        items={items}
        eyebrow={t.shop.rail.eyebrow}
        caption={t.shop.rail.caption}
        hanger="none"
        autoplay
        interval={3200}
        labels={{ front: t.shop.rail.front, back: t.shop.rail.back, close: t.shop.rail.close, show: t.shop.rail.show }}
        onOpenChange={(i) => i !== null && setPicked(i)}
        action={
          current && (
            <Link href={`/shop/${current.slug}`} className="inline-flex min-h-12 items-center rounded-sm bg-primary px-7 font-medium text-primary-fg hover:opacity-90">
              {t.shop.openPiece}: {bi(current.title)}
            </Link>
          )
        }
      />
    </div>
  );
}
