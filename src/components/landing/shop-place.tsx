import Image from "next/image";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { CATEGORY_LABEL, DEMO_PRODUCTS, formatSar, type DemoProduct } from "@/lib/demo/products";

function Piece({ p, className, sizes, priority = false }: { p: DemoProduct; className: string; sizes: string; priority?: boolean }) {
  return (
    <Link href="/shop" className={`group flex flex-col ${className}`}>
      <div className="relative min-h-56 flex-1 overflow-hidden rounded-md bg-surface">
        <Image
          src={p.image.src}
          alt={p.image.alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        />
      </div>
      <div className="mt-3 flex items-baseline justify-between gap-4">
        <div>
          <p className="text-[1.05rem] font-medium underline-offset-4 group-hover:underline">{p.title}</p>
          <p className="text-sm text-muted-foreground">
            {CATEGORY_LABEL[p.category]}, by {p.maker}
          </p>
        </div>
        <p className="shrink-0 tabular-nums">{formatSar(p.priceSar)}</p>
      </div>
    </Link>
  );
}

/** Real pieces in an editorial layout: one large photo leads, the rest follow at their own sizes. */
export function ShopPlace() {
  const [lead, bags, penguins, top, doll, flowers, blanket] = DEMO_PRODUCTS;
  return (
    <section id="shop-place" aria-labelledby="shop-place-heading" className="scroll-mt-20 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="grid gap-6 md:grid-cols-[1.3fr_1fr] md:items-end">
          <h2 id="shop-place-heading" className="text-balance text-4xl leading-[1.05] sm:text-6xl">
            Clothes, bags and toys, made by hand.
          </h2>
          <div>
            <p className="max-w-md text-lg leading-relaxed text-muted-foreground">
              Every piece here was crocheted by a maker you can talk to. Pick a color and size, or send them your own design.
            </p>
            <ButtonLink href="/shop" variant="wine" size="lg" className="mt-6">
              Visit the shop
            </ButtonLink>
          </div>
        </div>

        <div className="mt-14 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-12">
          <Piece p={lead} className="col-span-2 md:col-span-7 md:row-span-2 [&>div:first-child]:aspect-[4/5] md:[&>div:first-child]:aspect-auto" sizes="(min-width: 768px) 58vw, 100vw" priority />
          <Piece p={bags} className="col-span-2 md:col-span-5 [&>div:first-child]:aspect-[4/3]" sizes="(min-width: 768px) 42vw, 100vw" />
          <Piece p={penguins} className="col-span-1 md:col-span-5 [&>div:first-child]:aspect-square" sizes="(min-width: 768px) 42vw, 50vw" />
          <Piece p={top} className="col-span-1 md:col-span-4 [&>div:first-child]:aspect-[3/4]" sizes="(min-width: 768px) 33vw, 50vw" />
          <Piece p={doll} className="col-span-1 md:col-span-4 [&>div:first-child]:aspect-[3/4]" sizes="(min-width: 768px) 33vw, 50vw" />
          <Piece p={flowers} className="col-span-1 md:col-span-4 [&>div:first-child]:aspect-[3/4]" sizes="(min-width: 768px) 33vw, 50vw" />
          <Piece p={blanket} className="col-span-2 md:col-span-12 [&>div:first-child]:aspect-[21/8]" sizes="100vw" />
        </div>
        <p className="mt-8 text-xs text-muted-foreground">
          Demo photos: {DEMO_PRODUCTS.map((p) => p.image.credit).filter((c, i, a) => a.indexOf(c) === i).join("; ")}.
        </p>
      </div>
    </section>
  );
}
