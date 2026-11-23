import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { dirOf } from "@/lib/i18n/config";
import { DICT } from "@/lib/i18n/dict";
import { getLocale } from "@/lib/i18n/server";
import { THEME_INIT_SCRIPT } from "@/lib/theme";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = DICT[locale];
  return {
    title: { default: `${t.site.name} · ${t.site.tagline}`, template: `%s · ${t.site.name}` },
    description: t.site.tagline,
  };
}

export const viewport: Viewport = {
  themeColor: "#FAF8F7",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale} dir={dirOf(locale)} data-theme="light" suppressHydrationWarning>
      <head>
        {/* Applies the saved theme before first paint, so there is no flash. Light is the default. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <link rel="preload" href="/fonts/alexandria-arabic-wght-normal.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/ibm-plex-sans-arabic-arabic-400-normal.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[80] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-fg"
        >
          {DICT[locale].nav.skip}
        </a>
        <Providers locale={locale}>{children}</Providers>
      </body>
    </html>
  );
}
