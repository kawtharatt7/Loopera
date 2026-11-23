"use client";

import { useEffect, useState } from "react";
import { StudioEditor } from "@/components/studio/studio-editor";
import type { EditorDoc } from "@/lib/editor/state";
import { starterDoc } from "@/lib/editor/starters";
import { DesignSpecSchema } from "@/lib/spec/schema";

const HANDOFF_KEY = "loopera-editor-handoff";

/** Opens the editor on the pattern the creator just made (passed through sessionStorage). */
export function EditorFromCreator() {
  const [doc, setDoc] = useState<EditorDoc | null>(null);
  useEffect(() => {
    let next = starterDoc("blank");
    try {
      const raw = JSON.parse(sessionStorage.getItem(HANDOFF_KEY) ?? "null") as Partial<EditorDoc> | null;
      const spec = DesignSpecSchema.safeParse(raw?.spec);
      const h = Number(raw?.targetHeightCm);
      if (spec.success && Number.isFinite(h) && h >= 3 && h <= 200) {
        next = { ...next, title: String(raw?.title ?? next.title).slice(0, 80), spec: spec.data, targetHeightCm: h };
      }
    } catch {
      // keep the blank start
    }
    setDoc(next);
  }, []);
  if (!doc) return <div className="h-[60vh]" />;
  return <StudioEditor initial={doc} />;
}
