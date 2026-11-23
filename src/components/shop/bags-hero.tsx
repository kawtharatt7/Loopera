"use client";

import { useMemo } from "react";
import SneakerProductHero, { type SneakerSize, type SneakerVariant } from "@/components/ui/sneaker-product-hero";
import { useBag } from "@/components/bag/bag-context";
import { useT } from "@/lib/i18n/client";
import type { Product } from "@/lib/shop/catalog";
import { optimizedSrc } from "@/lib/shop/image";
import { tokenHex } from "@/lib/theme-colors";

/**
 * Bags use the product hero from the shoe prompt (21st.dev SneakerProductHero).
 * In the section, each swatch is a different bag; on a bag's own page, each swatch is one of its colors.
 */
export function BagsHero({
  bags,
  mode,
  collectionTitle = "",
  collectionBlurb = "",
}: {
  bags: Product[];
  mode: "collection" | "single";
  collectionTitle?: string;
  collectionBlurb?: string;
}) {
  const { t, bi } = useT();
  const { add } = useBag();

  const variants: SneakerVariant[] = useMemo(() => {
    if (mode === "collection") {
      return bags.map((b) => {
        const src = optimizedSrc(b.photos[0].src, 1080);
        return {
          name: bi(b.title),
          swatch: b.colors[0].hex,
          tint: b.colors[0].hex,
          src,
          stock: Object.fromEntries(b.sizes.map((s) => [bi(s.label), s.stock])),
          gallery: b.photos.map((p) => ({ src: optimizedSrc(p.src, 1080), label: bi(p.alt) })),
        };
      });
    }
    const b = bags[0];
    return b.colors.map((c) => ({
      name: bi(c.name),
      swatch: c.hex,
      tint: c.hex,
      src: optimizedSrc(b.photos[0].src, 1080),
      stock: Object.fromEntries(b.sizes.map((s) => [bi(s.label), c.stock?.[s.id] ?? s.stock])),
      gallery: b.photos.map((p) => ({ src: optimizedSrc(p.src, 1080), label: bi(p.alt) })),
    }));
  }, [bags, mode, bi]);

  const first = bags[0];
  const sizes: SneakerSize[] = first.sizes.map((s) => ({ label: bi(s.label), price: s.price, rating: first.rating, reviews: first.reviews, stock: s.stock }));

  return (
    <div className="loopera-piece" dir="ltr">
      <SneakerProductHero
        variants={variants}
        eyebrow={mode === "collection" ? t.shop.bagsHeadline : t.common.by(bi(first.maker))}
        title={mode === "collection" ? collectionTitle : bi(first.title)}
        description={mode === "collection" ? collectionBlurb : bi(first.description)}
        sizes={sizes}
        price={first.sizes[0].price}
        rating={first.rating}
        reviews={first.reviews}
        currency="SAR "
        lowStock={2}
        toast={t.common.added}
        likeColor={tokenHex("ember")}
        height="min(100svh, 820px)"
        onAddToCart={({ variant, size }) => {
          if (mode === "collection") {
            const bag = bags.find((b) => bi(b.title) === variant.name) ?? first;
            const sz = bag.sizes.find((s) => bi(s.label) === size) ?? bag.sizes[0];
            add({ slug: bag.slug, color: bag.colors[0].id, size: sz.id });
          } else {
            const color = first.colors.find((c) => bi(c.name) === variant.name) ?? first.colors[0];
            const sz = first.sizes.find((s) => bi(s.label) === size) ?? first.sizes[0];
            add({ slug: first.slug, color: color.id, size: sz.id });
          }
        }}
      />
    </div>
  );
}
