"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import SneakerProductHero, { type SneakerSize, type SneakerVariant } from "@/components/ui/sneaker-product-hero";
import { CATEGORY_LABEL, formatSar, type DemoProduct } from "@/lib/demo/products";
import { addToCart, useCart } from "@/lib/shop/cart";
import { optimizedSrc } from "@/lib/shop/image";
import { tokenHex } from "@/lib/theme-colors";

/** Product page: the 21st.dev product hero, worded for crochet, writing to the real cart. */
export function ProductDetail({ product }: { product: DemoProduct }) {
  const cart = useCart();
  const [note, setNote] = useState<string | null>(null);
  const src = optimizedSrc(product.image.src, 1080);

  const variants: SneakerVariant[] = useMemo(
    () =>
      product.colors.map((c) => ({
        name: c.name,
        swatch: c.hex,
        tint: c.hex,
        src,
        stock: Object.fromEntries(product.sizes.map((s) => [s.label, c.stock?.[s.label] ?? s.stock])),
        gallery: [
          { src, label: c.name === product.shownIn ? "Front" : `Front, shown in ${product.shownIn}` },
          { src, label: "Stitch detail", focus: [0.5, 0.42], zoom: 2.2 },
          { src, label: "Close-up", focus: [0.5, 0.6], zoom: 1.6 },
          { src, label: "Texture", focus: [0.35, 0.5], zoom: 2.8 },
        ],
      })),
    [product, src],
  );

  const sizes: SneakerSize[] = product.sizes.map((s) => ({
    label: s.label,
    price: s.price,
    rating: product.rating,
    reviews: product.reviews,
    stock: s.stock,
  }));

  const inCart = cart.filter((l) => l.slug === product.slug).reduce((a, l) => a + l.qty, 0);

  return (
    <div className="loopera-piece">
      <SneakerProductHero
        variants={variants}
        eyebrow={`${CATEGORY_LABEL[product.category]} by ${product.maker}`}
        title={product.title}
        description={`${product.description} Shown in ${product.shownIn}${product.madeToOrder ? "; other colors are crocheted to order" : ""}.`}
        sizes={sizes}
        price={product.sizes[0].price}
        rating={product.rating}
        reviews={product.reviews}
        currency="SAR "
        lowStock={2}
        toast="Added to your cart"
        likeColor={tokenHex("ember")}
        height="min(100svh, 860px)"
        onAddToCart={({ variant, size }) => {
          const ok = addToCart({ slug: product.slug, color: variant.name, size });
          setNote(ok ? `${product.title}, ${variant.name}, ${size} is in your cart.` : `There are no more ${variant.name} pieces in ${size}. Pick another color or size.`);
        }}
      />

      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-[1.2fr_1fr]">
        <div>
          <h2 className="text-3xl">About this piece</h2>
          <p className="mt-4 max-w-prose leading-relaxed text-muted-foreground">{product.description}</p>
          <ul className="mt-6 space-y-2">
            {product.details.map((d) => (
              <li key={d} className="border-b border-line/10 pb-2">
                {d}
              </li>
            ))}
            <li className="border-b border-line/10 pb-2">
              {product.madeToOrder ? `Made to order, ready in about ${product.leadTimeDays} days` : `Ready to ship, dispatched in ${product.leadTimeDays} days`}
            </li>
          </ul>
        </div>
        <div className="rounded-2xl bg-surface p-6" aria-live="polite">
          <p className="text-lg">{note ?? `Prices start at ${formatSar(product.sizes[0].price)}.`}</p>
          {inCart > 0 && (
            <p className="mt-2 text-muted-foreground">
              You have {inCart} of these in your cart.{" "}
              <Link href="/cart" className="text-brand underline underline-offset-4">
                Go to cart
              </Link>
            </p>
          )}
          <p className="mt-6 text-sm text-muted-foreground">Photo: {product.image.credit}</p>
        </div>
      </section>
    </div>
  );
}
