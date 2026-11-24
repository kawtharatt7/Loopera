"use client";

import { useEffect, useState } from "react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { useT } from "@/lib/i18n/client";
import { CollectionSections, SECTION_IDS, useSectionLabel } from "./collection";

/** The store: one section per kind of piece, each with its own way of showing things. */
export function StorePage() {
  const { t } = useT();
  const label = useSectionLabel();
  const [current, setCurrent] = useState("clothes");

  // Highlights the tab of the section in view.
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setCurrent(e.target.id)),
      { rootMargin: "-45% 0px -50% 0px" },
    );
    SECTION_IDS.forEach((c) => {
      const el = document.getElementById(c.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  return (
    <>
      <SiteHeader />
      <main id="main" className="pt-28 sm:pt-20">
        <div className="mx-auto max-w-7xl px-5 pb-6 pt-8 sm:px-8 sm:pt-14">
          <h1 className="text-5xl sm:text-7xl">{t.shop.title}</h1>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground">{t.shop.intro}</p>
        </div>

        <nav aria-label={t.shop.title} className="sticky top-[6.75rem] z-40 border-y border-line/10 bg-bg/85 backdrop-blur-md sm:top-16">
          <ul className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-3 sm:px-6 [scrollbar-width:none]">
            {SECTION_IDS.map((c) => (
              <li key={c.id}>
                <a
                  href={`#${c.id}`}
                  aria-current={current === c.id ? "true" : undefined}
                  className={`inline-flex min-h-12 items-center whitespace-nowrap border-b-2 px-4 text-[15px] transition-colors ${current === c.id ? "border-primary text-fg" : "border-transparent text-muted-foreground hover:text-fg"}`}
                >
                  {label(c.cat)}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <CollectionSections />
      </main>
      <SiteFooter />
    </>
  );
}
