// Loopera's mark: a crochet chain, the first row of every piece, drawn as three linked loops.
// The wordmark stays "loopera" in both languages so the brand reads the same everywhere.

const LOOP = "M0 0C3.2-4.6 9.6-4.6 12.2 0C9.6 4.6 3.2 4.6 0 0Z";

export function ChainMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="-1 -6 34 12" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true">
      <path d={LOOP} />
      <path d={LOOP} transform="translate(9.4 0)" />
      <path d={LOOP} transform="translate(18.8 0)" />
    </svg>
  );
}

/** Wordmark. Size it with font-size (text-xl, text-2xl…). Letters rise in on load and ripple on hover. */
export function Logo({ className = "" }: { className?: string }) {
  const letters = "loopera".split("");
  return (
    <span className={`lp-logo relative inline-flex items-end leading-none ${className}`} dir="ltr" aria-label="loopera">
      <span aria-hidden="true" className="relative inline-flex">
        {letters.map((ch, i) => (
          <span key={i} className="lp-ch" style={{ ["--i" as string]: i }}>
            {ch}
          </span>
        ))}
        {/* a strand of yarn drawn under the word, ending in a small loop */}
        <svg viewBox="0 0 120 12" preserveAspectRatio="none" className="pointer-events-none absolute -bottom-[0.22em] left-0 h-[0.3em] w-[108%] text-terracotta" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <path className="lp-strand" d="M2 6 C 22 1, 40 11, 60 6 S 96 1, 106 6 C 112 9, 117 6, 114 3 C 111 0, 106 4, 110 7" />
        </svg>
      </span>
    </span>
  );
}

/** Kept for places that only need the mark. */
export function LogoMark({ className = "" }: { className?: string }) {
  return <ChainMark className={className} />;
}
