import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/site-header";
import { StudioEditor } from "@/components/studio/studio-editor";
import { isStarterKey, starterDoc } from "@/lib/editor/starters";

export const metadata: Metadata = { title: "New design" };

export default async function NewDesignPage({ searchParams }: { searchParams: Promise<{ start?: string }> }) {
  const { start } = await searchParams;
  const key = isStarterKey(start) ? start : "blank";
  return (
    <>
      <SiteHeader />
      <main id="main" className="min-h-dvh">
        <StudioEditor key={key} initial={starterDoc(key)} />
      </main>
    </>
  );
}
