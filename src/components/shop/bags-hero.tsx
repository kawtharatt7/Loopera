"use client";

import { useEffect, useMemo, useState } from "react";
import SneakerProductHero, { type SneakerSize, type SneakerVariant } from "@/components/ui/sneaker-product-hero";
import { useBag } from "@/components/bag/bag-context";
import { useT } from "@/lib/i18n/client";
import type { Product } from "@/lib/shop/catalog";
import { optimizedSrc } from "@/lib/shop/image";
import { recolorUrl } from "@/lib/shop/recolor";
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
  // On a bag's own page every color swatch shows the bag repainted in that yarn.
  const [painted, setPainted] = useState<Record<string, string>>({});
  useEffect(() => {
    const b = bags[0];
    if (mode !== "single" || !b.recolor) return;
    let live = true;
    b.colors
      .filter((c) => c.hex !== "transparent")
      .forEach((c) =>
        recolorUrl(b.cutout ?? b.photos[0].src, b.cutout ? undefined : b.recolor!.mask, b.recolor!.from, c.hex)
          .then((u) => live && setPainted((m) => ({ ...m, [c.id]: u })))
          .catch(() => undefined),
      );
    return () => {
      live = false;
    };
  }, [bags, mode]);

  // Cut-out bags stand in the hero like the shoes it was made for; framed photos are the fallback.
  const withCutout = bags.filter((b) => b.cutout);
  const shown = mode === "collection" && withCutout.length >= 2 ? withCutout : bags;
  const cutouts = shown.every((b) => b.cutout);
  const variants: SneakerVariant[] = useMemo(() => {
    if (mode === "collection") {
      return shown.map((b) => {
        const src = b.cutout ?? optimizedSrc(b.photos[0].src, 1080);
        return {
          name: bi(b.title),
          swatch: b.recolor?.from ?? b.colors[0].hex,
          tint: b.recolor?.from ?? b.colors[0].hex,
          src,
          stock: Object.fromEntries(b.sizes.map((s) => [bi(s.label), s.stock])),
          gallery: b.photos.map((p) => ({ src: optimizedSrc(p.src, 1080), label: bi(p.alt) })),
        };
      });
    }
    const b = bags[0];
    return b.colors.map((c) => ({
      name: bi(c.name),
      swatch: c.hex === "transparent" ? (b.recolor?.from ?? "#999") : c.hex,
      tint: c.hex === "transparent" ? (b.recolor?.from ?? "#999") : c.hex,
      src: painted[c.id] ?? b.cutout ?? optimizedSrc(b.photos[0].src, 1080),
      stock: Object.fromEntries(b.sizes.map((s) => [bi(s.label), c.stock?.[s.id] ?? s.stock])),
      gallery: b.photos.map((p) => ({ src: optimizedSrc(p.src, 1080), label: bi(p.alt) })),
    }));
  }, [bags, shown, mode, bi, painted]);

  const first = shown[0];
  const sizes: SneakerSize[] = first.sizes.map((s) => ({ label: bi(s.label), price: s.price, rating: first.rating, reviews: first.reviews, stock: s.stock }));

  return (
    <div className={cutouts ? "loopera-cutout" : "loopera-piece"} dir="ltr">
      <SneakerProductHero
        variants={variants}
        word="loopera"
        eyebrow={mode === "collection" ? "loopera" : t.common.by(bi(first.maker))}
        title={mode === "collection" ? collectionTitle : bi(first.title)}
        description={mode === "collection" ? collectionBlurb : bi(first.description)}
        sizes={sizes}
        price={first.sizes[0].price}
        rating={first.rating}
        reviews={first.reviews}
        currency="SAR "
        lowStock={2}
        toast={t.common.added}
        likeColor={tokenHex("wine")}
        height="min(100svh, 820px)"
        onAddToCart={({ variant, size }) => {
          if (mode === "collection") {
            const bag = shown.find((b) => bi(b.title) === variant.name) ?? first;
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
