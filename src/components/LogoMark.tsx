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

/** Wordmark. Size it with font-size (text-xl, text-2xl…); the chain scales with the text. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-[0.35em] font-serif font-semibold leading-none tracking-[-0.03em] ${className}`} dir="ltr">
      <span>loopera</span>
      <ChainMark className="h-[0.42em] w-auto translate-y-[0.12em] text-wine" />
    </span>
  );
}

/** Kept for places that only need the mark. */
export function LogoMark({ className = "" }: { className?: string }) {
  return <ChainMark className={className} />;
}
