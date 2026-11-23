"use client";

import { useCallback, useEffect, useState } from "react";

const PREFIX = "loopera-progress:";

/** Ticked rounds for one pattern, kept in this browser so they survive a refresh. */
export function useProgress(id: string | null) {
  const [done, setDone] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!id) return setDone(new Set());
    try {
      const raw = JSON.parse(localStorage.getItem(PREFIX + id) ?? "[]") as unknown;
      setDone(new Set(Array.isArray(raw) ? raw.filter((x): x is string => typeof x === "string").slice(0, 5000) : []));
    } catch {
      setDone(new Set());
    }
  }, [id]);

  const save = useCallback(
    (next: Set<string>) => {
      if (!id) return;
      try {
        localStorage.setItem(PREFIX + id, JSON.stringify([...next]));
      } catch {
        // storage full or blocked: ticks still work for this visit
      }
    },
    [id],
  );

  const toggle = useCallback(
    (key: string) =>
      setDone((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        save(next);
        return next;
      }),
    [save],
  );

  const clear = useCallback(() => {
    setDone(new Set());
    save(new Set());
  }, [save]);

  return { done, toggle, clear };
}

/** Short stable id from any string (FNV-1a). */
export function hashId(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}
