"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { useState } from "react";
import { LogoMark } from "@/components/LogoMark";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { SITE_NAME } from "@/lib/site";

const NAV = [
  { href: "/studio", label: "Studio", hint: "I crochet" },
  { href: "/shop", label: "Shop", hint: "I want to buy" },
] as const;

/** Sticky header: transparent over the hero, a soft frosted bar once the page scrolls. */
export function SiteHeader() {
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 24));

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5">
      <div
        className={`mx-auto flex max-w-6xl items-center justify-between rounded-full border px-3 py-2 transition-[background-color,border-color,backdrop-filter] duration-300 sm:px-4 ${
          scrolled ? "border-line/10 bg-surface/75 backdrop-blur-md" : "border-transparent bg-transparent"
        }`}
      >
        <Link href="/" className="flex items-center gap-2 rounded-full pr-2" aria-label={`${SITE_NAME} home`}>
          <LogoMark className="h-9 w-9" />
          <span className="font-serif text-xl tracking-tight sm:text-2xl">{SITE_NAME}</span>
        </Link>
        <nav aria-label="Primary" className="flex items-center gap-1">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className="relative inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium text-fg transition-colors hover:text-brand"
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 -z-10 rounded-full bg-surface-2"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                {item.label}
              </Link>
            );
          })}
          <ThemeToggle className="ml-1" />
        </nav>
      </div>
    </header>
  );
}
