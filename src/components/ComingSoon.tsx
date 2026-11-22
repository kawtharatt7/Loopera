import Link from "next/link";
import { LogoMark } from "@/components/LogoMark";

interface ComingSoonProps {
  tone: "studio" | "shop";
  title: string;
  blurb: string;
  phase: string;
}

// Friendly placeholder used until a section is built in a later phase.
export function ComingSoon({ tone, title, blurb, phase }: ComingSoonProps) {
  const background = tone === "studio" ? "bg-sage/50" : "bg-butter/50";

  return (
    <main
      id="main"
      className={`flex min-h-dvh items-center justify-center px-5 py-16 ${background}`}
    >
      <div className="w-full max-w-lg rounded-5xl border border-cocoa/10 bg-cream p-10 text-center">
        <LogoMark className="mx-auto h-12 w-12" />
        <p className="mt-6 text-xs font-medium uppercase tracking-[0.18em] text-cocoa/70">
          {phase}
        </p>
        <h1 className="mt-2 text-4xl">{title}</h1>
        <p className="mt-4 leading-relaxed text-cocoa/80">{blurb}</p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center rounded-full bg-cocoa px-6 py-3 text-sm font-medium text-cream transition-opacity hover:opacity-90"
        >
          Back to the doors
        </Link>
      </div>
    </main>
  );
}
