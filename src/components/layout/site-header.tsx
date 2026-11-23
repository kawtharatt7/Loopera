"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMotionValueEvent, useScroll } from "framer-motion";
import { useState } from "react";
import { LogoMark } from "@/components/LogoMark";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { SITE_NAME } from "@/lib/site";

const NAV = [
  { href: "/studio", label: "Studio" },
  { href: "/shop", label: "Shop" },
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
        className={`mx-auto flex max-w-6xl items-center justify-between rounded-2xl px-3 py-2 transition-[background-color,backdrop-filter] duration-300 sm:px-4 ${
          scrolled ? "bg-bg/85 backdrop-blur-md" : "bg-transparent"
        }`}
      >
        <Link href="/" className="flex items-center gap-2 rounded-full pr-2" aria-label={`${SITE_NAME} home`}>
          <LogoMark className="h-9 w-9" />
          <span className="font-serif text-2xl">{SITE_NAME}</span>
        </Link>
        <nav aria-label="Primary" className="flex items-center gap-1">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex min-h-11 items-center px-3 text-[15px] underline-offset-[6px] transition-colors hover:underline ${active ? "underline decoration-2 decoration-peach" : ""}`}
              >
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
