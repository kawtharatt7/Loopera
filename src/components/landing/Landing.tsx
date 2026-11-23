"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { useBag } from "@/components/bag/bag-context";
import { useRecolored } from "@/lib/shop/recolor";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { useT } from "@/lib/i18n/client";
import { byCategory, CATEGORIES, formatSar, fromPrice, getProduct, PRODUCTS, type Category, type Product } from "@/lib/shop/catalog";

// The pieces on the opening stage, all photographed on the same studio background.
const STAGE = ["checker-dress", "wine-shell-bag", "graduation-bouquet", "white-poncho", "cocoa-luxe-bag", "grad-keychains", "yellow-mesh-poncho", "bow-bag"];
const SPEED = 5000;
const SHOWN: Category[] = ["clothes", "bags", "graduation", "wall", "dolls", "flowers"];

/**
 * The opening: one real piece at a time floats over the moving background, a big word behind it,
 * turning a little toward the pointer. The pieces change on their own (with a progress bar per piece)
 * until the visitor takes over. Then a moving strip of every piece, and the sections.
 */
export function Landing() {
  const { t, bi, locale } = useT();
  const strip = PRODUCTS.filter((p) => p.photos[0]?.src.startsWith("/photos/"));
  const sections = SHOWN.map((id) => ({ id, label: bi(CATEGORIES.find((c) => c.id === id)!.label), product: byCategory(id)[0] })).filter((s) => s.product);

  return (
    <>
      <SiteHeader overlay />
      <main id="main">
        <HeroStage />

        {/* A moving strip of real pieces, two rows in opposite directions */}
        <section aria-label={t.landing.browse} className="overflow-hidden py-10" dir="ltr">
          {[0, 1].map((row) => {
            const list = strip.filter((_, k) => k % 2 === row);
            return (
              <div key={row} className="group flex w-max gap-4 py-2 hover:[animation-play-state:paused]" style={{ animation: `hero-marquee ${list.length * 6}s linear infinite ${row ? "reverse" : ""}` }}>
                {[...list, ...list].map((p, k) => (
                  <Link key={`${p.slug}-${k}`} href={`/shop/${p.slug}`} className="relative block h-56 w-44 shrink-0 overflow-hidden bg-surface sm:h-72 sm:w-56" tabIndex={k < list.length ? 0 : -1} aria-hidden={k >= list.length}>
                    <Image src={p.photos[0].src} alt={k < list.length ? bi(p.photos[0].alt) : ""} fill sizes="224px" className="object-cover transition-transform duration-700 hover:scale-105" />
                  </Link>
                ))}
              </div>
            );
          })}
        </section>

        <section aria-labelledby="browse" className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
          <h2 id="browse" className="text-3xl sm:text-4xl">
            {t.landing.browse}
          </h2>
          <ul className="mt-8 grid grid-cols-2 gap-x-5 gap-y-8 md:grid-cols-3">
            {sections.map((s) => (
              <li key={s.id}>
                <Link href={`/shop#${s.id}`} className="group block">
                  <div className="relative aspect-[4/5] overflow-hidden bg-surface">
                    <Image src={s.product.photos[0].src} alt={bi(s.product.photos[0].alt)} fill sizes="(min-width: 768px) 30vw, 46vw" className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]" />
                  </div>
                  <p className="mt-3 font-serif text-xl underline-offset-4 group-hover:underline">{s.label}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

/**
 * The opening, after "Try the Look": a stage with the current piece in front and its neighbours
 * standing back in the blur, a numbered progress bar per piece that runs on its own, and a panel
 * where the piece can be repainted in another yarn color and added to the bag.
 */
function HeroStage() {
  const { t, bi, locale } = useT();
  const { add } = useBag();
  const reduce = useReducedMotion() ?? false;
  const items = STAGE.map((slug) => getProduct(slug)).filter((p): p is NonNullable<typeof p> => !!p);
  const n = items.length;
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [hold, setHold] = useState(false);
  const [colorBy, setColorBy] = useState<Record<string, string>>({});
  const [added, setAdded] = useState<string | null>(null);
  const p = items[i];
  const colorId = colorBy[p.slug] ?? p.colors[0].id;
  const color = p.colors.find((c) => c.id === colorId) ?? p.colors[0];
  const go = useCallback((d: number) => setI((x) => (x + d + n) % n), [n]);

  useEffect(() => {
    if (!playing || hold || reduce) return;
    const id = window.setTimeout(() => go(1), SPEED);
    return () => clearTimeout(id);
  }, [i, playing, hold, reduce, go]);

  const num = (k: number) => String(k + 1).padStart(2, "0");
  const slot = (k: number) => {
    let d = k - i;
    if (d > n / 2) d -= n;
    if (d < -n / 2) d += n;
    return d;
  };

  return (
    <section aria-roledescription="carousel" aria-label={t.landing.kicker} className="relative isolate overflow-hidden pt-16">
      <div className="mx-auto grid max-w-[1500px] grid-cols-1 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="relative flex min-w-0 flex-col">
          <div className="px-5 pt-8 sm:px-10 sm:pt-12">
            <h1 className="max-w-[20ch] text-balance text-4xl leading-[1.08] sm:text-6xl">{t.landing.headline}</h1>
            <p className="mt-3 max-w-md text-muted-foreground">{t.landing.sub}</p>
          </div>

          {/* Stage: neighbours stand back in the blur, the current piece in front */}
          <div className="relative h-[min(62svh,600px)] min-h-[380px] overflow-hidden" onPointerEnter={() => setHold(true)} onPointerLeave={() => setHold(false)}>
            {items.map((it, k) => {
              const d = slot(k);
              const abs = Math.abs(d);
              const visible = abs <= 2;
              return (
                <motion.button
                  key={it.slug}
                  type="button"
                  tabIndex={-1}
                  aria-hidden={d !== 0}
                  onClick={() => (d === 0 ? undefined : setI(k))}
                  className="absolute bottom-6 left-1/2 aspect-[4/5] h-[66%] overflow-hidden sm:h-[86%] rounded-sm bg-[#E8E3DE] shadow-[0_30px_60px_-30px_rgba(0,0,0,0.6)]"
                  style={{ zIndex: 10 - abs, pointerEvents: visible ? "auto" : "none" }}
                  initial={false}
                  animate={{
                    x: `calc(-50% + ${d * (locale === "ar" ? -1 : 1) * 62}%)`,
                    scale: 1 - abs * 0.16,
                    opacity: visible ? 1 - abs * 0.3 : 0,
                    filter: `blur(${abs * 2.5}px)`,
                  }}
                  transition={reduce ? { duration: 0 } : { duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                >
                  <StagePhoto product={it} hex={(it.colors.find((c) => c.id === (colorBy[it.slug] ?? it.colors[0].id))?.hex) ?? null} />
                </motion.button>
              );
            })}
          </div>

          {/* Progress: one bar per piece, the current one filling */}
          <div className="flex items-center gap-3 px-5 pb-6 sm:px-10">
            <button type="button" onClick={() => go(-1)} aria-label={t.landing.prev} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm border border-fg/25 hover:border-fg">
              <svg viewBox="0 0 26 14" className="h-3.5 w-6 rtl:-scale-x-100" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M25 7H1M7 1L1 7l6 6" />
              </svg>
            </button>
            <div className="flex min-w-0 flex-1 gap-1.5 overflow-hidden">
              {items.map((it, k) => (
                <button
                  key={it.slug}
                  type="button"
                  aria-current={k === i}
                  aria-label={`${num(k)} ${bi(it.title)}`}
                  onClick={() => setI(k)}
                  className={`group flex h-11 min-w-[14px] flex-col justify-center gap-2 text-start text-[10px] tabular-nums text-muted-foreground transition-[flex-basis] duration-700 ${k === i ? "flex-[0_0_120px] text-fg sm:flex-[0_0_180px]" : "flex-[0_1_44px]"}`}
                >
                  <span className="relative block h-[2px] w-full overflow-hidden bg-fg/15 group-hover:scale-y-150">
                    <span
                      key={k === i ? `${i}-${playing && !hold}` : "x"}
                      className={`absolute inset-0 origin-left bg-fg rtl:origin-right ${k < i ? "scale-x-100 opacity-40" : k === i ? (playing && !hold && !reduce ? "hero-fill" : "scale-x-100") : "scale-x-0"}`}
                      style={{ animationDuration: `${SPEED}ms` }}
                    />
                  </span>
                  <span className="truncate">
                    {num(k)}
                    {k === i && <>&nbsp;&nbsp;{bi(it.title)}</>}
                  </span>
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setPlaying((x) => !x)} aria-pressed={playing} aria-label={playing ? t.landing.pause : t.landing.play} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm hover:bg-fg/10">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
                <path d={playing ? "M6.5 4.5h3.5v15H6.5zM14 4.5h3.5v15H14z" : "M7 4.5v15l12.5-7.5z"} />
              </svg>
            </button>
            <button type="button" onClick={() => go(1)} aria-label={t.landing.next} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm border border-fg/25 hover:border-fg">
              <svg viewBox="0 0 26 14" className="h-3.5 w-6 rtl:-scale-x-100" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M1 7h24M19 1l6 6-6 6" />
              </svg>
            </button>
          </div>
        </div>

        {/* The piece on stage: name, color, add */}
        <aside className="flex flex-col gap-5 border-line/15 bg-bg/70 p-6 backdrop-blur-sm lg:border-s lg:p-8 lg:pt-12" onPointerEnter={() => setHold(true)} onPointerLeave={() => setHold(false)}>
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg">{t.landing.inThisLook}</h2>
            <span className="text-xs tabular-nums text-muted-foreground">{t.landing.pieceOf(num(i), num(n - 1))}</span>
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={p.slug} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.45 }} className="flex flex-col gap-5">
              <div>
                <p className="text-sm text-muted-foreground">{t.common.by(bi(p.maker))}</p>
                <h3 className="mt-1 text-2xl">{bi(p.title)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{bi(p.description)}</p>
                <p className="mt-3 text-lg tabular-nums">{formatSar(fromPrice(p), locale)}</p>
              </div>
              {p.colors.length > 1 && (
                <fieldset>
                  <legend className="text-sm">
                    {t.common.color}: <span className="text-muted-foreground">{bi(color.name)}</span>
                  </legend>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {p.colors.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        aria-pressed={c.id === colorId}
                        aria-label={bi(c.name)}
                        onClick={() => {
                          setPlaying(false);
                          setColorBy((m) => ({ ...m, [p.slug]: c.id }));
                        }}
                        className={`h-9 w-9 rounded-full border-2 p-0.5 ${c.id === colorId ? "border-fg" : "border-transparent hover:border-line/50"}`}
                      >
                        <span className="block h-full w-full rounded-full ring-1 ring-line/20" style={{ background: c.hex === "transparent" ? (p.recolor?.from ?? "#999") : c.hex }} />
                      </button>
                    ))}
                  </div>
                </fieldset>
              )}
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (add({ slug: p.slug, color: colorId, size: p.sizes[0].id })) setAdded(p.slug + colorId);
                  }}
                  className="min-h-12 rounded-sm bg-primary px-6 font-medium text-primary-fg hover:opacity-90"
                >
                  {added === p.slug + colorId ? t.common.added : t.common.addToBag}
                </button>
                <Link href={`/shop/${p.slug}`} className="inline-flex min-h-11 items-center justify-center rounded-sm border border-fg/25 text-sm hover:border-fg">
                  {t.landing.seePiece}
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
          <div className="mt-auto flex gap-3 border-t border-line/10 pt-5 text-sm">
            <Link href="/shop" className="underline underline-offset-4">
              {t.landing.storeTitle}
            </Link>
            <Link href="/creator" className="underline underline-offset-4">
              {t.landing.creatorTitle}
            </Link>
          </div>
        </aside>
      </div>
    </section>
  );
}

function StagePhoto({ product, hex }: { product: Product; hex: string | null }) {
  const { bi } = useT();
  const src = useRecolored(product.photos[0].src, product.recolor, hex === "transparent" ? null : hex);
  // eslint-disable-next-line @next/next/no-img-element -- local studio photo or its repainted copy
  return <img src={src} alt={bi(product.title)} className="h-full w-full object-cover" draggable={false} />;
}
