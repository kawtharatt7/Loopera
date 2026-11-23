import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { STARTERS, type StarterKey } from "@/lib/editor/starters";
import { DAILY_FREE_DESIGNS } from "@/lib/credits/constants";

export const metadata: Metadata = { title: "Studio" };

const ORDER: StarterKey[] = ["blank", "ball", "bear", "granny"];

export default function StudioPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="bg-grid min-h-dvh px-5 pb-20 pt-28 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-brand">Studio</p>
          <h1 className="mt-2 text-4xl sm:text-5xl">Start a design</h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Build a piece part by part and watch the pattern update as you go. Editing is always free; you get {DAILY_FREE_DESIGNS} free AI designs every day once you sign in.
          </p>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ORDER.map((k) => (
              <li key={k}>
                <Link
                  href={`/studio/new?start=${k}`}
                  className="group flex h-full flex-col rounded-4xl border border-line/10 bg-surface/70 p-6 transition-[transform,background-color] duration-200 hover:-translate-y-1 hover:bg-surface-2"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-bg/70 text-peach" aria-hidden="true">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                      {k === "blank" ? <path d="M12 5v14M5 12h14" /> : k === "granny" ? <path d="M5 5h14v14H5zM9 9h6v6H9z" /> : k === "bear" ? <path d="M7 6.5a2.5 2.5 0 1 1 3 2M17 6.5a2.5 2.5 0 1 0-3 2M12 20a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z" /> : <circle cx="12" cy="12" r="7" />}
                    </svg>
                  </span>
                  <span className="mt-5 font-serif text-2xl">{STARTERS[k].label}</span>
                  <span className="mt-1 text-sm text-muted-foreground">{STARTERS[k].blurb}</span>
                  <span className="mt-auto pt-6 text-sm text-brand">Open in the editor →</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </>
  );
}
