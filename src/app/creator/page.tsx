import type { Metadata } from "next";
import { Creator } from "@/components/creator/creator";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { DICT } from "@/lib/i18n/dict";
import { getLocale } from "@/lib/i18n/server";
import { isTapestryId } from "@/lib/tapestry/designs";

export async function generateMetadata(): Promise<Metadata> {
  const t = DICT[await getLocale()];
  return { title: t.creator.title, description: t.creator.intro };
}

export default async function CreatorPage({ searchParams }: { searchParams: Promise<{ tapestry?: string; type?: string }> }) {
  const { tapestry, type } = await searchParams;
  return (
    <>
      <SiteHeader />
      <main id="main" className="min-h-dvh">
        <Creator initialTapestry={tapestry && isTapestryId(tapestry) ? tapestry : null} initialType={type === "wall" ? "wall" : null} />
      </main>
      <SiteFooter />
    </>
  );
}
