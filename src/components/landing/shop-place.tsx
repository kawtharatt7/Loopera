"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import ClothingRailHero, { type RailGarment } from "@/components/ui/product-rail-gallery";
import { ButtonLink } from "@/components/ui/button";
import { DEMO_PRODUCTS, formatSar, fromPrice } from "@/lib/demo/products";
import { optimizedSrc } from "@/lib/shop/image";

/**
 * The clothing rail from 21st.dev. Clothes use its drawn garments in the maker's yarn color
 * until a maker uploads a cut-out photo; bags, toys and flowers use their photos.
 * Choosing a piece opens its product page with the color options.
 */
export function ShopPlace() {
  const router = useRouter();
  const items: RailGarment[] = useMemo(
    () =>
      DEMO_PRODUCTS.map((p) => ({
        id: p.slug,
        name: p.title,
        description: `${p.description} By ${p.maker}.`,
        kind: p.railKind ?? undefined,
        color: p.colors[0].hex,
        trim: p.colors[1]?.hex ?? p.colors[0].hex,
        image: p.railKind ? undefined : optimizedSrc(p.image.src, 640),
        tag: formatSar(fromPrice(p)),
        details: [`${p.colors.length} colors`, p.sizes.map((s) => s.label).join(", "), p.madeToOrder ? "Made to order" : "Ready to ship"],
      })),
    [],
  );

  return (
    <section id="shop-place" aria-label="Shop" className="scroll-mt-20 border-t border-line/10">
      <ClothingRailHero
        items={items}
        heading="Clothes, bags and toys, made by hand."
        caption="Brush along the rail. Pick a piece to choose its color and size."
        action={
          <ButtonLink href="/shop" variant="wine" size="lg">
            Visit the shop
          </ButtonLink>
        }
        autoplay
        interval={2600}
        hanger="wood"
        labels={{ front: "Front", back: "Back", close: "Close", show: "View piece" }}
        onOpenChange={(index) => {
          if (index !== null && DEMO_PRODUCTS[index]) router.push(`/shop/${DEMO_PRODUCTS[index].slug}`);
        }}
      />
    </section>
  );
}
