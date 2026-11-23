export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" className={className} strokeWidth="2" strokeLinecap="round">
      <circle cx="16" cy="16" r="14" className="fill-ember stroke-wine" />
      <path d="M5 13c6-4 16-4 22 1" className="stroke-rose" />
      <path d="M4 19c7-4 17-4 24 1" className="stroke-rose" />
      <path d="M10 6c5 5 6 13 3 21" className="stroke-peach" />
      <path d="M27 21c2 3 3 6 2 9" className="stroke-peach" />
    </svg>
  );
}
