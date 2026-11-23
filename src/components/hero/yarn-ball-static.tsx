/** Static SVG yarn ball, used when WebGL is unavailable. */
export function YarnBallStatic({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 320" className={className} role="img" aria-label="A ball of yarn">
      <defs>
        <radialGradient id="yb-shade" cx="38%" cy="32%" r="70%">
          <stop offset="0%" className="[stop-color:rgb(var(--peach))]" />
          <stop offset="60%" className="[stop-color:rgb(var(--ember))]" />
          <stop offset="100%" className="[stop-color:rgb(var(--wine))]" />
        </radialGradient>
        <clipPath id="yb-clip">
          <circle cx="160" cy="150" r="100" />
        </clipPath>
      </defs>
      <circle cx="160" cy="150" r="100" fill="url(#yb-shade)" />
      <g clipPath="url(#yb-clip)" fill="none" strokeWidth="5" strokeLinecap="round" className="stroke-rose/70">
        <path d="M60 120c60-40 140-40 200 10" />
        <path d="M58 150c70-45 150-40 205 5" />
        <path d="M62 180c70-40 150-35 196 0" />
        <path d="M120 52c-30 60-30 140 10 196" />
        <path d="M160 50c-25 70-20 140 15 200" />
        <path d="M200 58c-20 60-15 130 20 180" />
      </g>
      <g fill="none" strokeWidth="5" strokeLinecap="round">
        <path d="M215 228c30 20 40 50 75 60" className="stroke-peach" />
        <path d="M110 232c-20 30-50 40-80 48" className="stroke-rose" />
      </g>
    </svg>
  );
}
