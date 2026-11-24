"use client";

import { useC } from "@/lib/i18n/collection";

/** A slow strip of house promises, in the current language only. */
export function Marquee() {
  const items = useC().marquee;
  const row = [...items, ...items];
  return (
    <div className="overflow-hidden border-y border-line/10 bg-surface py-4" aria-label={items.join(" · ")}>
      <div aria-hidden="true" className="loop-marquee flex w-max gap-10 whitespace-nowrap font-serif text-xl sm:text-2xl" style={{ animation: "loop-marquee 38s linear infinite" }}>
        {[0, 1].map((k) => (
          <span key={k} className="flex gap-10">
            {row.map((t, i) => (
              <span key={`${k}-${i}`} className="flex items-center gap-10">
                {t}
                <span className="text-terracotta">✳</span>
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  );
}
