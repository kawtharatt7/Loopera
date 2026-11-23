"use client";

import Link from "next/link";
import { LogoMark } from "@/components/LogoMark";
import { useT } from "@/lib/i18n/client";

export function SiteFooter() {
  const { t } = useT();
  return (
    <footer className="border-t border-line/10 px-5 py-10 sm:px-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 sm:flex-row">
        <div className="flex items-center gap-2">
          <LogoMark className="h-7 w-7" />
          <span className="font-serif text-lg font-bold">{t.site.name}</span>
          <span className="text-sm text-muted-foreground">{t.footer.line}</span>
        </div>
        <nav aria-label={t.site.name} className="flex gap-1 text-sm">
          <Link href="/shop" className="inline-flex min-h-11 items-center px-4 text-muted-foreground hover:text-fg">
            {t.nav.store}
          </Link>
          <Link href="/creator" className="inline-flex min-h-11 items-center px-4 text-muted-foreground hover:text-fg">
            {t.nav.creator}
          </Link>
          <Link href="/orders" className="inline-flex min-h-11 items-center px-4 text-muted-foreground hover:text-fg">
            {t.orders.title}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
