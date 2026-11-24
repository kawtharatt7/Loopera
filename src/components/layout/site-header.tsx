"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMotionValueEvent, useScroll } from "framer-motion";
import { useState } from "react";
import { useBag } from "@/components/bag/bag-context";
import { Logo } from "@/components/LogoMark";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useSetLocale, useT } from "@/lib/i18n/client";
import { cartCount, useCart } from "@/lib/shop/cart";

/** Header: the two places, language, theme and the bag. Clear over the page top, solid once scrolled. */
export function SiteHeader({ overlay = false, tone, compact = false }: { overlay?: boolean; tone?: "hero"; compact?: boolean }) {
  const pathname = usePathname();
  const { t, locale } = useT();
  const setLocale = useSetLocale();
  const { setOpen } = useBag();
  const count = cartCount(useCart());
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 24));
  const solid = scrolled || !overlay;

  const NAV = [
    { href: "/shop", label: t.nav.store },
    { href: "/creator", label: t.nav.creator },
  ];

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${solid ? "bg-bg/90 backdrop-blur-md" : tone === "hero" ? "bg-transparent text-[#210C0F]" : "bg-transparent"}`}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="flex min-h-11 items-center" aria-label={`${t.site.name}, ${t.nav.home}`}>
          <Logo className="text-[26px]" />
        </Link>
        <nav aria-label={t.nav.home} className="flex items-center gap-0.5 sm:gap-1">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`hidden min-h-11 items-center px-3 text-[15px] underline-offset-[7px] hover:underline sm:inline-flex ${active ? "underline decoration-[1.5px] decoration-wine" : ""}`}
              >
                {item.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
            aria-label={t.nav.langLabel}
            className="inline-flex min-h-11 items-center rounded-lg px-3 text-[15px] hover:bg-surface-2"
            lang={locale === "ar" ? "en" : "ar"}
          >
            {t.nav.lang}
          </button>
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setOpen(true)}
            data-bag-icon
            aria-label={t.bag.openBag(count)}
            className="relative inline-flex h-11 w-11 items-center justify-center rounded-lg hover:bg-surface-2"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 8h14l-1.2 11.2a1 1 0 0 1-1 .8H7.2a1 1 0 0 1-1-.8Z M9 8V6.5a3 3 0 0 1 6 0V8" />
            </svg>
            {count > 0 && (
              <span className="absolute end-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-wine px-1 text-[10px] font-semibold text-white">{count}</span>
            )}
          </button>
        </nav>
      </div>
      {/* Mobile: the two places as a second row */}
      <nav aria-label={t.nav.home} className={`border-t border-line/10 sm:hidden ${compact ? "hidden" : "flex"}`}>
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={`flex min-h-11 flex-1 items-center justify-center text-sm ${active ? "font-semibold text-brand" : ""}`}>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
