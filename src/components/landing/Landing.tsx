"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useState } from "react";
import { SiteHeader } from "@/components/layout/site-header";
import { useT } from "@/lib/i18n/client";

type Side = "store" | "creator" | null;

const PHOTOS = {
  store: "https://images.unsplash.com/photo-1475179377649-672d1c1c75ec?auto=format&fit=crop&w=1800&q=75",
  creator: "https://images.unsplash.com/photo-1777537953560-10fda7d9965a?auto=format&fit=crop&w=1800&q=75",
};

/**
 * The home page is just the two places. On wide screens the half under the pointer opens up;
 * on phones they stack.
 */
export function Landing() {
  const { t } = useT();
  const [hover, setHover] = useState<Side>(null);

  const halves = [
    { id: "store" as const, href: "/shop", title: t.landing.storeTitle, line: t.landing.storeLine, alt: t.landing.storePhotoAlt },
    { id: "creator" as const, href: "/creator", title: t.landing.creatorTitle, line: t.landing.creatorLine, alt: t.landing.creatorPhotoAlt },
  ];

  return (
    <>
      <SiteHeader overlay />
      <main id="main" className="flex h-[100svh] flex-col md:flex-row" onMouseLeave={() => setHover(null)}>
        {halves.map((h) => {
          const grow = hover === null ? 1 : hover === h.id ? 1.55 : 0.75;
          return (
            <motion.div key={h.id} className="relative min-h-0 flex-1 overflow-hidden" animate={{ flexGrow: grow }} transition={{ type: "spring", stiffness: 120, damping: 22 }} onMouseEnter={() => setHover(h.id)}>
              <Link href={h.href} className="group absolute inset-0 block" onFocus={() => setHover(h.id)}>
                <Image
                  src={PHOTOS[h.id]}
                  alt={h.alt}
                  fill
                  priority
                  sizes="(min-width: 768px) 60vw, 100vw"
                  className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/10" />
                <div className="absolute inset-x-0 bottom-0 p-6 pb-8 text-white sm:p-10 md:pb-14">
                  <h2 className="text-5xl font-extrabold sm:text-6xl lg:text-7xl">{h.title}</h2>
                  <p className="mt-3 max-w-md text-base leading-relaxed text-white/85 sm:text-lg">{h.line}</p>
                  <span className="mt-6 inline-flex items-center gap-3 border-b border-white/70 pb-1 text-base font-medium">
                    {t.landing.enter}
                    <svg viewBox="0 0 20 20" className="h-4 w-4 transition-transform group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M4 10h12M11 5l5 5-5 5" />
                    </svg>
                  </span>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </main>
    </>
  );
}
