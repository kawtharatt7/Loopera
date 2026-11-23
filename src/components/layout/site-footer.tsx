import Link from "next/link";
import { LogoMark } from "@/components/LogoMark";
import { SITE_NAME } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-line/10 px-5 py-10 sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
        <div className="flex items-center gap-2">
          <LogoMark className="h-7 w-7" />
          <span className="font-serif text-lg">{SITE_NAME}</span>
          <span className="text-sm text-muted-foreground">· Made with yarn and math.</span>
        </div>
        <nav aria-label="Footer" className="flex gap-1 text-sm">
          <Link href="/studio" className="inline-flex min-h-11 items-center rounded-full px-4 text-muted-foreground hover:text-fg">
            Studio
          </Link>
          <Link href="/shop" className="inline-flex min-h-11 items-center rounded-full px-4 text-muted-foreground hover:text-fg">
            Shop
          </Link>
        </nav>
      </div>
    </footer>
  );
}
