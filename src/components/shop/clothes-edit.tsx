"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { useT } from "@/lib/i18n/client";
import { formatSar, fromPrice, type Product } from "@/lib/shop/catalog";

/**
 * "Wear the edit": real people wearing the pieces, standing in one long row that drifts slowly
 * sideways. The list beside it names every piece; pointing at one brings its photo forward.
 */
export function ClothesEdit({ products }: { products: Product[] }) {
  const { t, bi, locale } = useT();
  const reduce = useReducedMotion() ?? false;
  const row = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<string | null>(null);
  const paused = useRef(false);

  // Gentle drift; pauses while the visitor touches, hovers or picks from the list.
  useEffect(() => {
    const el = row.current;
    if (!el || reduce) return;
    let raf = 0;
    let dir = 1;
    const tick = () => {
      if (!paused.current) {
        el.scrollLeft += 0.35 * dir;
        if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 1) dir = -1;
        if (el.scrollLeft <= 0) dir = 1;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduce]);

  const focus = (slug: string) => {
    setActive(slug);
    paused.current = true;
    const el = row.current?.querySelector<HTMLElement>(`[data-slug="${slug}"]`);
    el?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", inline: "center", block: "nearest" });
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div
        ref={row}
        dir="ltr"
        className="flex h-[min(78svh,720px)] gap-3 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onPointerEnter={() => (paused.current = true)}
        onPointerLeave={() => {
          paused.current = false;
          setActive(null);
        }}
        onTouchStart={() => (paused.current = true)}
      >
        {products.map((p, i) => {
          const photo = p.photos.find((ph) => ph.kind === "model") ?? p.photos[0];
          if (!photo) return null;
          const dim = active !== null && active !== p.slug;
          return (
            <Link
              key={p.slug}
              href={`/shop/${p.slug}`}
              data-slug={p.slug}
              onMouseEnter={() => setActive(p.slug)}
              onFocus={() => focus(p.slug)}
              className="group relative h-full w-[min(72vw,440px)] shrink-0 overflow-hidden rounded-md bg-surface"
            >
              <Image
                src={photo.src}
                alt={bi(photo.alt)}
                fill
                priority={i < 2}
                sizes="(min-width: 1024px) 440px, 72vw"
                className={`object-cover transition-[transform,filter,opacity] duration-700 group-hover:scale-[1.03] ${dim ? "opacity-55 saturate-50" : ""}`}
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-5 pt-16 text-white" dir={locale === "ar" ? "rtl" : "ltr"}>
                <p className="text-lg font-semibold">{bi(p.title)}</p>
                <p className="text-sm text-white/80">{formatSar(fromPrice(p), locale)}</p>
              </div>
            </Link>
          );
        })}
      </div>

      <aside aria-label={t.shop.clothesList} className="lg:pt-2">
        <h3 className="text-sm font-medium text-muted-foreground">{t.shop.clothesList}</h3>
        <ul className="mt-3 divide-y divide-line/10 border-y border-line/10">
          {products.map((p) => {
            const photo = p.photos[0];
            return (
              <li key={p.slug}>
                <Link
                  href={`/shop/${p.slug}`}
                  onMouseEnter={() => focus(p.slug)}
                  onMouseLeave={() => {
                    setActive(null);
                    paused.current = false;
                  }}
                  onFocus={() => focus(p.slug)}
                  className={`flex items-center gap-3 py-3 transition-colors ${active === p.slug ? "text-peach" : ""}`}
                >
                  <span className="relative h-16 w-12 shrink-0 overflow-hidden rounded bg-surface">
                    {photo && <Image src={photo.src} alt="" fill sizes="48px" className="object-cover" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{bi(p.title)}</span>
                    <span className="block text-sm text-muted-foreground">{bi(p.maker)}</span>
                  </span>
                  <span className="shrink-0 text-sm tabular-nums">{formatSar(fromPrice(p), locale)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
        <p className="mt-4 text-sm text-muted-foreground">{t.shop.clothesHint}</p>
      </aside>
    </div>
  );
}
