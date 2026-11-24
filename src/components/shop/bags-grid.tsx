"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useBag } from "@/components/bag/bag-context";
import SneakerProductHero, { type SneakerVariant, type SneakerView } from "@/components/ui/sneaker-product-hero";
import { useC } from "@/lib/i18n/collection";
import { useT } from "@/lib/i18n/client";
import { formatSar, fromPrice, type Product } from "@/lib/shop/catalog";
import { recolorUrl } from "@/lib/shop/recolor";

const cutoutOf = (p: Product) => p.cutout;

const swatchOf = (p: Product, hex: string) => (hex === "transparent" ? (p.recolor?.from ?? "#C9785C") : hex);

/**
 * Bags in a calm grid: each card is the bag cut out on oatmeal linen, its name, its starting price
 * and the yarn colours it comes in. A card opens the bag up close in SneakerProductHero (21st.dev):
 * pick Mini, Midi or Maxi, repaint it in another yarn, hold to see the stitches, add to the bag.
 */
export function BagsGrid({ bags }: { bags: Product[] }) {
  const { t, bi, locale } = useT();
  const [open, setOpen] = useState<number | null>(null);
  const opener = useRef<HTMLElement | null>(null);

  const close = useCallback(() => {
    setOpen(null);
    opener.current?.focus();
  }, []);

  return (
    <>
      <p className="mb-6 text-sm text-muted-foreground">{t.shop.bagsGrid}</p>
      <ul className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
        {bags.map((b, i) => (
          <li key={b.slug}>
            <button
              type="button"
              onClick={(e) => {
                opener.current = e.currentTarget;
                setOpen(i);
              }}
              className="group block w-full text-start"
              aria-haspopup="dialog"
            >
              <span className="relative flex aspect-[4/5] items-center justify-center overflow-hidden bg-surface">
                <span aria-hidden="true" className="absolute inset-0" style={{ background: "radial-gradient(80% 60% at 70% 15%, rgb(255 236 210 / 0.7), transparent 70%)" }} />
                <span aria-hidden="true" className="absolute bottom-[12%] left-1/2 h-5 w-1/2 -translate-x-1/2 rounded-[50%] bg-[rgb(60_30_10/0.22)] blur-md transition-transform duration-500 group-hover:scale-x-90" />
                {/* eslint-disable-next-line @next/next/no-img-element -- local cut-out */}
                <img
                  src={cutoutOf(b) ?? b.photos[0].src}
                  alt={bi(b.title)}
                  loading="lazy"
                  className={`relative max-h-[72%] max-w-[78%] transition-transform duration-500 ease-out group-hover:-translate-y-2 group-hover:scale-[1.03] ${cutoutOf(b) ? "object-contain drop-shadow-[0_18px_16px_rgba(60,30,10,0.22)]" : "h-full w-full max-h-none max-w-none object-cover"}`}
                  draggable={false}
                />
              </span>
              <span className="mt-3 flex items-baseline justify-between gap-3">
                <span className="font-serif text-lg leading-snug underline-offset-4 group-hover:underline">{bi(b.title)}</span>
                <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                  {t.common.from} {formatSar(fromPrice(b), locale)}
                </span>
              </span>
              <span className="mt-2 flex gap-1.5" aria-label={`${t.common.color}: ${b.colors.map((c) => bi(c.name)).join("، ")}`}>
                {b.colors.slice(0, 6).map((c) => (
                  <span key={c.id} className="h-3.5 w-3.5 rounded-full ring-1 ring-line/20" style={{ background: swatchOf(b, c.hex) }} />
                ))}
                {b.colors.length > 6 && <span className="text-xs text-muted-foreground">+{b.colors.length - 6}</span>}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {open !== null && bags[open] && <ProductDialog key={bags[open].slug} product={bags[open]} onClose={close} />}
    </>
  );
}

/** A piece up close (bags, and clothes on the model): sizes, yarn colours, stitch zoom, add to bag. */
export function ProductDialog({ product: bag, onClose, view = "hanger" }: { product: Product; onClose: () => void; view?: "hanger" | "model" }) {
  const { t, bi, locale } = useT();
  const c2 = useC();
  const { add } = useBag();
  const box = useRef<HTMLDivElement | null>(null);
  // Clothes: on their hanger when we have one, otherwise on the model; each with a garment-only mask.
  const hanger = view === "hanger" ? bag.hanger : undefined;
  const cut = hanger ?? bag.model ?? cutoutOf(bag);
  const base = cut ?? bag.photos[0].src;
  const garmentMask = hanger ? bag.masks?.hanger : bag.model ? bag.masks?.model : undefined;
  const [painted, setPainted] = useState<Record<string, string>>({});

  // Repaint the bag in every yarn colour it is offered in (our own photo, recoloured in the browser).
  useEffect(() => {
    let live = true;
    if (!bag.recolor) return;
    const from = bag.recolor.from;
    const mask = garmentMask ?? (cut ? undefined : bag.recolor.mask);
    bag.colors.forEach((c) => {
      if (c.hex === "transparent") return;
      recolorUrl(base, mask, from, c.hex)
        .then((url) => live && setPainted((m) => ({ ...m, [c.id]: url })))
        .catch(() => undefined);
    });
    return () => {
      live = false;
    };
  }, [bag, base, cut, garmentMask]);

  // Esc closes; the page behind stops scrolling while the bag is open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !document.querySelector(".snp-viewer") && onClose();
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    box.current?.querySelector<HTMLButtonElement>("[data-close]")?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  const L = t.shop.bagLabels;
  const viewLabels = { front: t.shop.rail.front, stitch: locale === "ar" ? "تفاصيل الغرز" : "Stitch detail", handle: locale === "ar" ? "اليد" : "Handle", base: locale === "ar" ? "القاعدة" : "Base" };
  const variants: SneakerVariant[] = useMemo(
    () =>
      bag.colors.map((c) => {
        const src = c.hex === "transparent" ? base : (painted[c.id] ?? base);
        const gallery: SneakerView[] = [
          { src, label: viewLabels.front },
          { src, label: viewLabels.stitch, focus: [0.5, 0.6], zoom: 2.2 },
          { src, label: viewLabels.handle, focus: [0.5, 0.15], zoom: 1.9 },
          { src, label: viewLabels.base, focus: [0.5, 0.85], zoom: 1.9 },
          ...(hanger && bag.model ? [{ src: bag.model, label: c2.tryOn }] : []),
          ...(!hanger && bag.hanger ? [{ src: bag.hanger, label: c2.hangerView }] : []),
          ...bag.photos.map((ph) => ({ src: ph.src, label: bi(ph.alt) })),
        ];
        return { name: bi(c.name), swatch: swatchOf(bag, c.hex), tint: swatchOf(bag, c.hex), src, gallery };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- labels follow the locale
    [bag, base, painted, locale, c2],
  );

  return createPortal(
    <div ref={box} role="dialog" aria-modal="true" aria-label={bi(bag.title)} className="fixed inset-0 z-[400] flex items-stretch justify-center sm:items-center sm:p-6">
      <button type="button" aria-label={t.common.close} tabIndex={-1} onClick={onClose} className="absolute inset-0 bg-[rgb(38_33_30/0.45)] backdrop-blur-sm" />
      <div className="relative max-h-full w-full max-w-6xl overflow-y-auto bg-bg shadow-[0_40px_120px_-30px_rgba(0,0,0,0.5)] sm:rounded">
        <button
          type="button"
          data-close
          onClick={onClose}
          className="absolute end-3 top-3 z-20 inline-flex h-11 items-center gap-2 rounded-sm bg-bg/80 px-3 text-sm backdrop-blur hover:bg-surface"
        >
          {t.common.close}
          <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <path d="M3 3l10 10M13 3L3 13" />
          </svg>
        </button>
        <div className={bag.category === "clothes" && !hanger ? "loopera-cutout loopera-model" : "loopera-cutout"}>
          <SneakerProductHero
            variants={variants}
            eyebrow={bi(bag.maker)}
            title={bi(bag.title)}
            description={bi(bag.description)}
            word="loopera"
            swap={bag.category === "clothes" ? "horizontal" : "vertical"}
            sizes={bag.sizes.map((s) => ({ label: bi(s.label), price: s.price, stock: s.stock }))}
            price={fromPrice(bag)}
            formatPrice={(n) => formatSar(n, locale)}
            showReviews={false}
            stockNote={bag.madeToOrder ? L.madeToOrder(bag.leadTimeDays) : undefined}
            likeColor="#C86D51"
            toast={L.toast}
            height="min(88svh, 760px)"
            labels={{
              size: L.size,
              price: L.price,
              colour: L.colour,
              add: L.add,
              soldOut: L.soldOut,
              added: L.added,
              zoom: L.zoom,
              tap: L.tap,
              saved: L.saved,
              removed: L.removed,
              sizeNote: (s) => s,
              sizeGroup: t.common.size,
              closePhotos: t.common.close,
            }}
            onAddToCart={({ variant, size }) => {
              const color = bag.colors.find((c) => bi(c.name) === variant.name) ?? bag.colors[0];
              const sz = bag.sizes.find((s) => bi(s.label) === size) ?? bag.sizes[0];
              add({ slug: bag.slug, color: color.id, size: sz.id });
            }}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
