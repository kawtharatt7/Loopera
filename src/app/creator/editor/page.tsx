import type { Metadata } from "next";
import { EditorFromCreator } from "@/components/creator/editor-from-creator";
import { SiteHeader } from "@/components/layout/site-header";
import { StudioEditor } from "@/components/studio/studio-editor";
import { isStarterKey, starterDoc } from "@/lib/editor/starters";

export const metadata: Metadata = { title: "Editor" };

export default async function EditorPage({ searchParams }: { searchParams: Promise<{ start?: string }> }) {
  const { start } = await searchParams;
  return (
    <>
      <SiteHeader />
      <main id="main" className="min-h-dvh" dir="ltr">
        {start === "creator" ? <EditorFromCreator /> : <StudioEditor key={start ?? "blank"} initial={starterDoc(isStarterKey(start) ? start : "blank")} />}
      </main>
    </>
  );
}
