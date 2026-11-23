"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { useT } from "@/lib/i18n/client";
import { byCategory, CATEGORIES, type Category } from "@/lib/shop/catalog";

// Real photo: yarn on a white table. With multiply blending the white table takes the hero color,
// so the yarn sits straight on the one-color background.
const HERO = "https://images.unsplash.com/photo-1595341595379-cf1cb694ea1f?auto=format&fit=crop&w=1800&q=80";

const SHOWN: Category[] = ["clothes", "bags", "dolls", "graduation", "flowers", "home"];

/** One color, real yarn, the two places. Then a row into each section of the store. */
export function Landing() {
  const { t, bi } = useT();
  const photo = useRef<HTMLDivElement>(null);

  // The yarn follows the pointer by a few pixels: the only moving thing on the page.
  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || !photo.current || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    photo.current.style.transform = `translate3d(${(x * -14).toFixed(1)}px, ${(y * -10).toFixed(1)}px, 0)`;
  };

  const sections = SHOWN.map((id) => ({ id, label: bi(CATEGORIES.find((c) => c.id === id)!.label), product: byCategory(id)[0] })).filter((s) => s.product);

  return (
    <>
      <SiteHeader overlay tone="hero" />
      <main id="main">
        <section onPointerMove={onMove} className="relative flex min-h-[100svh] items-end overflow-hidden bg-[#EED6D0] text-[#210C0F]">
          <div ref={photo} className="absolute inset-0 transition-transform duration-700 ease-out" aria-hidden="false">
            <Image src={HERO} alt={t.landing.heroAlt} fill priority sizes="100vw" className="hero-photo object-cover object-[60%_40%]" />
          </div>
          <div className="relative mx-auto w-full max-w-7xl px-5 pb-14 pt-40 sm:px-8 sm:pb-20">
            <h1 className="max-w-[14ch] text-balance text-5xl leading-[1.08] sm:text-7xl">{t.landing.headline}</h1>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-[#210C0F]/80">{t.landing.sub}</p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link href="/shop" className="inline-flex min-h-12 items-center rounded-sm bg-[#210C0F] px-8 text-[15px] font-medium text-white hover:bg-[#8E1523]">
                {t.landing.storeTitle}
              </Link>
              <Link href="/creator" className="inline-flex min-h-12 items-center rounded-sm border border-[#210C0F] px-8 text-[15px] font-medium hover:bg-[#210C0F] hover:text-white">
                {t.landing.creatorTitle}
              </Link>
            </div>
          </div>
        </section>

        <section aria-labelledby="browse" className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
          <h2 id="browse" className="text-3xl sm:text-4xl">
            {t.landing.browse}
          </h2>
          <ul className="mt-8 grid grid-cols-2 gap-x-5 gap-y-8 md:grid-cols-3">
            {sections.map((s) => (
              <li key={s.id}>
                <Link href={`/shop#${s.id}`} className="group block">
                  <div className="relative aspect-[4/5] overflow-hidden bg-surface">
                    <Image src={s.product.photos[0].src} alt={bi(s.product.photos[0].alt)} fill sizes="(min-width: 768px) 30vw, 46vw" className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]" />
                  </div>
                  <p className="mt-3 font-serif text-xl underline-offset-4 group-hover:underline">{s.label}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
