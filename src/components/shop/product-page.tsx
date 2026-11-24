"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState, type ReactNode } from "react";
import { useBag } from "@/components/bag/bag-context";
import { useRecolored } from "@/lib/shop/recolor";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { useT } from "@/lib/i18n/client";
import { byCategory, CATEGORIES, formatSar, stockFor, type Product } from "@/lib/shop/catalog";
import { TAPESTRIES } from "@/lib/tapestry/designs";
import { BagShowcase } from "./bag-showcase";
import { PieceImage } from "./piece-image";
import { CardRow } from "./product-card";

function Accordion({ title, children, defaultOpen = false }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-line/20">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex min-h-12 w-full items-center justify-between text-start">
        <span>{title}</span>
        <span className={`text-lg transition-transform duration-300 ${open ? "rotate-45" : ""}`} aria-hidden="true">
          +
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
            <div className="pb-4 text-[15px] leading-relaxed text-muted-foreground">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Chip({ selected, disabled, onClick, children, swatch }: { selected: boolean; disabled?: boolean; onClick: () => void; children: ReactNode; swatch?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={`inline-flex min-h-10 items-center gap-2 rounded-sm border px-4 text-sm transition-colors disabled:cursor-not-allowed disabled:line-through disabled:opacity-40 ${
        selected ? "border-fg bg-fg/10" : "border-line/25 hover:border-line/60"
      }`}
    >
      {swatch && <span className="h-4 w-4 rounded-full ring-1 ring-line/30" style={{ backgroundColor: swatch }} aria-hidden="true" />}
      {children}
    </button>
  );
}

/** A small stitch chart of a wall hanging, one square per stitch. */
function ChartPreview({ product }: { product: Product }) {
  if (!product.tapestry) return null;
  const d = TAPESTRIES[product.tapestry];
  return (
    <div className="grid w-full gap-px rounded bg-line/20 p-px" style={{ gridTemplateColumns: `repeat(${d.width}, 1fr)` }} dir="ltr" aria-hidden="true">
      {d.grid.flatMap((row, y) => row.map((c, x) => <span key={`${x}-${y}`} className="aspect-square" style={{ backgroundColor: d.palette[c].hex }} />))}
    </div>
  );
}

export function ProductPage({ product }: { product: Product }) {
  const { t, bi, locale } = useT();
  const { add } = useBag();
  const [colorId, setColorId] = useState(product.colors[0].id);
  const [sizeId, setSizeId] = useState(product.sizes.find((s) => stockFor(product, product.colors[0].id, s.id) > 0)?.id ?? product.sizes[0].id);
  const [qty, setQty] = useState(1);
  const [view, setView] = useState<"model" | "hanger" | "chart" | "piece">(product.photos[0]?.kind === "hanger" ? "hanger" : product.tapestry ? "piece" : "model");
  const [note, setNote] = useState<string | null>(null);

  const size = product.sizes.find((s) => s.id === sizeId) ?? product.sizes[0];
  const color = product.colors.find((c) => c.id === colorId) ?? product.colors[0];
  const left = stockFor(product, colorId, sizeId);
  const more = useMemo(() => byCategory(product.category).filter((p) => p.slug !== product.slug).slice(0, 4), [product]);
  const category = CATEGORIES.find((c) => c.id === product.category)!;
  const kinds = new Set(product.photos.map((p) => p.kind));
  const [picked, setPicked] = useState<number | null>(null);
  const recolored = useRecolored(product.photos[0]?.src ?? "", product.recolor, product.recolor && colorId !== "as-shown" ? (product.colors.find((c) => c.id === colorId)?.hex ?? null) : null);
  const photoIndex = picked ?? Math.max(0, product.photos.findIndex((p) => (view === "hanger" ? p.kind === "hanger" : p.kind !== "hanger")));

  const details = (
    <div className="space-y-6">
      <div>
        <a href={`/shop#${product.category}`} className="text-sm text-muted-foreground hover:text-fg">
          {bi(category.label)}
        </a>
        <h1 className="mt-2 text-4xl sm:text-5xl">{bi(product.title)}</h1>
        <p className="mt-2 text-lg text-muted-foreground">{t.common.by(bi(product.maker))}</p>
      </div>
      <p className="max-w-prose leading-relaxed">{bi(product.description)}</p>
      {product.showcase ? (
        <p className="inline-flex w-fit rounded-full bg-surface px-4 py-1.5 text-sm text-muted-foreground">{locale === "ar" ? "للعرض فقط — نماذج أعمال" : "Showcase archive · not for sale"}</p>
      ) : (
        <p className="text-2xl tabular-nums">{formatSar(size.price, locale)}</p>
      )}

      {product.colors.length > 1 || product.colors[0].id !== "as-shown" ? (
        <div>
          <p className="text-sm text-muted-foreground">
            {t.common.color}: <span className="text-fg">{bi(color.name)}</span>
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {product.colors.map((c) => (
              <Chip key={c.id} selected={c.id === colorId} swatch={c.hex === "transparent" ? product.recolor?.from : c.hex} onClick={() => {
                  setColorId(c.id);
                  setPicked(null);
                }}>
                {bi(c.name)}
              </Chip>
            ))}
          </div>
        </div>
      ) : null}

      {product.sizes.length > 1 && (
        <div>
          <p className="text-sm text-muted-foreground">
            {t.common.size}: <span className="text-fg">{bi(size.label)}</span>
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {product.sizes.map((s) => (
              <Chip key={s.id} selected={s.id === sizeId} disabled={stockFor(product, colorId, s.id) === 0} onClick={() => setSizeId(s.id)}>
                {bi(s.label)}
              </Chip>
            ))}
          </div>
        </div>
      )}

      <p className="text-sm" aria-live="polite">
        {left === 0 ? t.common.soldOut : left <= 2 ? t.common.onlyLeft(left) : t.common.inStock}
        <span className="text-muted-foreground"> · {product.madeToOrder ? t.common.madeToOrder(product.leadTimeDays) : t.common.readyToShip(product.leadTimeDays)}</span>
      </p>

      <div className="flex gap-3">
        <div className="flex h-12 items-center rounded-lg border border-line/25">
          <button type="button" aria-label={t.bag.fewer} onClick={() => setQty((q) => Math.max(1, q - 1))} className="h-12 w-11">
            −
          </button>
          <span className="w-8 text-center tabular-nums" aria-label={t.common.qty}>
            {qty}
          </span>
          <button type="button" aria-label={t.bag.more} onClick={() => setQty((q) => Math.min(Math.max(1, left), q + 1))} className="h-12 w-11">
            +
          </button>
        </div>
        <button
          type="button"
          disabled={left === 0 || !!product.showcase}
          onClick={() => {
            const ok = add({ slug: product.slug, color: colorId, size: sizeId }, qty);
            setNote(ok ? null : t.bag.allWeHave);
          }}
          className="h-12 flex-1 rounded-lg bg-primary font-medium text-primary-fg transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {t.common.addToBag}
        </button>
      </div>
      {note && (
        <p role="alert" className="text-sm text-brand">
          {note}
        </p>
      )}

      <div className="border-t border-line/20">
        <Accordion title={t.product.about} defaultOpen>
          <ul className="space-y-1">
            {product.details.map((d) => (
              <li key={d.en}>{bi(d)}</li>
            ))}
          </ul>
          {product.tapestry && (
            <p className="mt-3">
              {t.product.chartLine(TAPESTRIES[product.tapestry].width, TAPESTRIES[product.tapestry].height, TAPESTRIES[product.tapestry].palette.length)}
            </p>
          )}
        </Accordion>
        <Accordion title={t.product.delivery}>{t.product.deliveryText}</Accordion>
        <Accordion title={t.product.returns}>{t.product.returnsText}</Accordion>
      </div>
      {product.photos.length > 0 && <p className="text-xs text-muted-foreground">{t.common.photo}: {product.photos.map((p) => p.credit).filter((c, i, a) => a.indexOf(c) === i).join(", ")}</p>}
    </div>
  );

  return (
    <>
      <SiteHeader />
      <main id="main" className="pt-28 sm:pt-16">
        {product.category === "bags" ? (
          <>
            <BagShowcase bags={[product]} linkToPage={false} />
            <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8">{details}</div>
          </>
        ) : (
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-8 sm:px-8 md:grid-cols-[1.05fr_1fr] md:py-14 lg:gap-16">
            <div className="md:sticky md:top-24 md:self-start">
              {(kinds.size > 1 || product.tapestry) && (
                <div role="tablist" className="mb-4 flex gap-2">
                  {product.tapestry ? (
                    <>
                      <Chip selected={view !== "chart"} onClick={() => setView("piece")}>
                        {bi(category.label)}
                      </Chip>
                      <Chip selected={view === "chart"} onClick={() => setView("chart")}>
                        {t.product.chart}
                      </Chip>
                    </>
                  ) : (
                    <>
                      <Chip selected={view === "model"} onClick={() => setView("model")}>
                        {t.product.onModel}
                      </Chip>
                      <Chip selected={view === "hanger"} onClick={() => setView("hanger")}>
                        {t.product.onHanger}
                      </Chip>
                    </>
                  )}
                </div>
              )}
              <div className={`relative overflow-hidden rounded-md ${product.tapestry ? "aspect-[3/4] bg-surface/70" : "aspect-[4/5] bg-surface"}`}>
                <AnimatePresence mode="wait">
                  <motion.div key={`${view}-${photoIndex}-${color.photo ?? ""}-${recolored}`} className="absolute inset-0" initial={{ opacity: 0, scale: 1.02 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
                    {view === "chart" ? (
                      <div className="flex h-full items-center justify-center p-6">
                        <ChartPreview product={product} />
                      </div>
                    ) : product.recolor && picked === null && color.hex !== "transparent" ? (
                      // eslint-disable-next-line @next/next/no-img-element -- repainted in the browser (data URL)
                      <img src={recolored} alt={`${bi(product.title)}, ${bi(color.name)}`} className="absolute inset-0 h-full w-full object-cover" />
                    ) : color.photo && picked === null ? (
                      <Image src={color.photo} alt={`${bi(product.title)}, ${bi(color.name)}`} fill sizes="(min-width: 768px) 50vw, 100vw" priority className="object-cover" />
                    ) : (
                      <PieceImage product={product} photoIndex={photoIndex} sizes="(min-width: 768px) 50vw, 100vw" priority />
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
              {kinds.size === 1 && product.photos.length > 1 && (
                <div className="mt-3 flex gap-2">
                  {product.photos.map((ph, i) => (
                    <button
                      key={ph.src}
                      type="button"
                      aria-label={bi(ph.alt)}
                      aria-pressed={photoIndex === i}
                      onClick={() => setPicked(i)}
                      className={`relative h-20 w-16 overflow-hidden rounded-sm border-2 ${photoIndex === i ? "border-fg" : "border-transparent"}`}
                    >
                      <Image src={ph.src} alt="" fill sizes="64px" className="object-cover" />
                    </button>
                  ))}
                </div>
              )}
              {product.tapestry && (
                <a href={`/creator?tapestry=${product.tapestry}`} className="mt-4 inline-block text-sm underline underline-offset-4">
                  {locale === "ar" ? "تبين تشتغلينها بنفسك؟ افتحي المخطط في صانع الكروشيه" : "Want to crochet it yourself? Open the chart in the crochet creator"}
                </a>
              )}
            </div>
            {details}
          </div>
        )}

        {more.length > 0 && (
          <section className="mt-6 border-t border-line/10 bg-surface/40 py-14">
            <div className="mx-auto max-w-7xl px-5 sm:px-8">
              <h2 className="text-3xl">{t.product.more}</h2>
              <div className="mt-8">
                <CardRow products={more} />
              </div>
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
