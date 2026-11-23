import type { DemoProduct } from "@/lib/demo/products";

/** Simple drawn crochet piece, colored with the product's own yarn color. */
export function PieceIllustration({ product, color, className = "" }: { product: DemoProduct; color: string; className?: string }) {
  const stitch = (
    <pattern id={`st-${product.slug}`} width="10" height="9" patternUnits="userSpaceOnUse">
      <path d="M1 7c2-5 6-5 8 0" fill="none" className="stroke-bg" strokeOpacity="0.16" strokeWidth="1.4" />
    </pattern>
  );

  if (product.category === "amigurumi") {
    return (
      <svg viewBox="0 0 200 240" className={className} aria-hidden="true">
        <defs>{stitch}</defs>
        <circle cx="68" cy="62" r="20" fill={color} />
        <circle cx="132" cy="62" r="20" fill={color} />
        <ellipse cx="100" cy="170" rx="56" ry="60" fill={color} />
        <circle cx="100" cy="96" r="50" fill={color} />
        <circle cx="100" cy="96" r="50" fill={`url(#st-${product.slug})`} />
        <ellipse cx="100" cy="170" rx="56" ry="60" fill={`url(#st-${product.slug})`} />
        <circle cx="82" cy="92" r="5" className="fill-bg" fillOpacity="0.85" />
        <circle cx="118" cy="92" r="5" className="fill-bg" fillOpacity="0.85" />
        <ellipse cx="100" cy="110" rx="12" ry="8" className="fill-fg" fillOpacity="0.5" />
      </svg>
    );
  }

  if (product.category === "bag") {
    return (
      <svg viewBox="0 0 200 240" className={className} aria-hidden="true">
        <defs>{stitch}</defs>
        <path d="M70 90c0-50 60-50 60 0" fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" />
        <path d="M40 90h120l-12 120H52Z" fill={color} />
        <path d="M40 90h120l-12 120H52Z" fill={`url(#st-${product.slug})`} />
      </svg>
    );
  }

  // Garments: a knit with sleeves; jackets get a placket, tees get short sleeves.
  const short = product.kind === "tee";
  const open = product.kind === "jacket" || product.kind === "coat" || product.slug.includes("cardigan");
  const sleeves = short
    ? "M58 50 28 82l18 22 18-14M142 50l30 32-18 22-18-14"
    : "M58 50 22 150l22 8 26-80M142 50l36 100-22 8-26-80";
  return (
    <svg viewBox="0 0 200 240" className={className} aria-hidden="true">
      <defs>{stitch}</defs>
      <path d={sleeves} fill={color} stroke={color} strokeWidth="4" strokeLinejoin="round" />
      <path d="M58 50c14-8 26-12 42 4 16-16 28-12 42-4l4 168H54Z" fill={color} />
      <path d="M58 50c14-8 26-12 42 4 16-16 28-12 42-4l4 168H54Z" fill={`url(#st-${product.slug})`} />
      <path d="M56 200h90" className="stroke-bg" strokeOpacity="0.15" strokeWidth="6" />
      {open && (
        <>
          <path d="M100 56v162" className="stroke-bg" strokeOpacity="0.22" strokeWidth="2" />
          {[90, 120, 150, 180].map((y) => (
            <circle key={y} cx="108" cy={y} r="4" className="fill-fg" fillOpacity="0.7" />
          ))}
        </>
      )}
    </svg>
  );
}
