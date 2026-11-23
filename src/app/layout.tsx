import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE } from "@/lib/site";

// Fonts are self-hosted (files in src/app/fonts) so the build never needs Google.
// Young Serif: a sturdy, slightly soft old-style serif with the weight of thick yarn. Headlines only.
const display = localFont({
  src: "./fonts/young-serif-latin-400-normal.woff2",
  variable: "--font-display",
  weight: "400",
  display: "swap",
});

// Figtree: a friendly, open sans for everything else.
const body = localFont({
  src: [
    { path: "./fonts/figtree-latin-wght-normal.woff2", style: "normal", weight: "300 900" },
    { path: "./fonts/figtree-latin-wght-italic.woff2", style: "italic", weight: "300 900" },
  ],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME} - ${SITE_TAGLINE}`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#1A0B0E" },
    { media: "(prefers-color-scheme: light)", color: "#1A0B0E" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${display.variable} ${body.variable}`}
    >
      <head>
        {/* Applies the saved theme before first paint, so there is no flash. Dark is the default. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-fg"
        >
          Skip to content
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
