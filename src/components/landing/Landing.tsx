"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { useT } from "@/lib/i18n/client";
import { byCategory, CATEGORIES, formatSar, fromPrice, getProduct, PRODUCTS, type Category } from "@/lib/shop/catalog";

type WordKey = "graduation" | "bags" | "clothes" | "dolls";

// The pieces that stand in the opening: real pieces, cut out of their photos.
const STAGE: { slug: string; word: WordKey }[] = [
  { slug: "wine-shell-bag", word: "bags" },
  { slug: "graduation-bouquet", word: "graduation" },
  { slug: "checker-dress", word: "clothes" },
  { slug: "cocoa-luxe-bag", word: "bags" },
  { slug: "grad-cups", word: "graduation" },
  { slug: "star-flower-bag", word: "bags" },
];
const SPEED = 5200;
const SHOWN: Category[] = ["clothes", "bags", "graduation", "wall", "dolls", "flowers"];

/**
 * The opening: one real piece at a time floats over the moving background, a big word behind it,
 * turning a little toward the pointer. The pieces change on their own (with a progress bar per piece)
 * until the visitor takes over. Then a moving strip of every piece, and the sections.
 */
export function Landing() {
  const { t, bi, locale } = useT();
  const reduce = useReducedMotion() ?? false;
  const items = STAGE.map((s) => ({ ...s, product: getProduct(s.slug)! })).filter((s) => s.product?.cutout);
  const [i, setI] = useState(0);
  const [dir, setDir] = useState(1);
  const [playing, setPlaying] = useState(true);
  const [hover, setHover] = useState(false);
  const item = items[i];

  const go = useCallback(
    (d: number) => {
      setDir(d);
      setI((x) => (x + d + items.length) % items.length);
    },
    [items.length],
  );

  useEffect(() => {
    if (!playing || hover || reduce) return;
    const id = window.setTimeout(() => go(1), SPEED);
    return () => clearTimeout(id);
  }, [i, playing, hover, reduce, go]);

  // Tilt toward the pointer.
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 120, damping: 18 });
  const sy = useSpring(my, { stiffness: 120, damping: 18 });
  const rotY = useTransform(sx, [-0.5, 0.5], [-12, 12]);
  const rotX = useTransform(sy, [-0.5, 0.5], [8, -8]);
  const wordX = useTransform(sx, [-0.5, 0.5], [30, -30]);
  const stage = useRef<HTMLDivElement>(null);
  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || reduce || !stage.current) return;
    const r = stage.current.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };

  const strip = PRODUCTS.filter((p) => p.photos[0]?.src.startsWith("/photos/"));
  const sections = SHOWN.map((id) => ({ id, label: bi(CATEGORIES.find((c) => c.id === id)!.label), product: byCategory(id)[0] })).filter((s) => s.product);
  const ease = [0.16, 1, 0.3, 1] as const;

  return (
    <>
      <SiteHeader overlay />
      <main id="main">
        <section
          ref={stage}
          onPointerMove={onMove}
          onPointerEnter={() => setHover(true)}
          onPointerLeave={() => {
            setHover(false);
            mx.set(0);
            my.set(0);
          }}
          aria-roledescription="carousel"
          aria-label={t.landing.kicker}
          className="relative flex min-h-[100svh] flex-col overflow-hidden pt-24"
        >
          {/* The big word behind the piece */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={item.word + i}
                style={{ x: wordX }}
                initial={reduce ? false : { opacity: 0, y: 60, filter: "blur(12px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={reduce ? undefined : { opacity: 0, y: -60, filter: "blur(12px)" }}
                transition={{ duration: 0.9, ease }}
                className="select-none whitespace-nowrap font-serif text-[30vw] font-extrabold leading-none tracking-[-0.06em] text-primary/[0.16] md:text-[22vw]"
              >
                {t.landing.words[item.word]}
              </motion.span>
            </AnimatePresence>
          </div>

          {/* The piece */}
          <div className="relative flex flex-1 items-center justify-center" style={{ perspective: 1000 }}>
            <AnimatePresence mode="popLayout" initial={false} custom={dir}>
              <motion.div
                key={item.slug}
                custom={dir}
                initial={reduce ? false : { opacity: 0, x: dir * 220, rotate: dir * 8, filter: "blur(10px)" }}
                animate={{ opacity: 1, x: 0, rotate: 0, filter: "blur(0px)" }}
                exit={reduce ? undefined : { opacity: 0, x: dir * -220, rotate: dir * -8, filter: "blur(10px)" }}
                transition={{ duration: 0.95, ease }}
                className="relative h-[min(58svh,560px)] w-[min(78vw,460px)]"
              >
                <motion.div className="relative h-full w-full" style={{ rotateX: rotX, rotateY: rotY, transformStyle: "preserve-3d" }}>
                  <motion.div
                    className="relative h-full w-full"
                    animate={reduce ? undefined : { y: [0, -14, 0] }}
                    transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Image src={item.product.cutout!} alt={bi(item.product.photos[0].alt)} fill priority sizes="(min-width: 768px) 460px, 78vw" className="object-contain drop-shadow-[0_30px_40px_rgba(0,0,0,0.45)]" />
                  </motion.div>
                </motion.div>
                <motion.span
                  aria-hidden="true"
                  className="absolute -bottom-6 left-1/2 h-6 w-2/3 -translate-x-1/2 rounded-[50%] bg-black/40 blur-md"
                  animate={reduce ? undefined : { scaleX: [1, 0.86, 1], opacity: [0.55, 0.35, 0.55] }}
                  transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Text and controls */}
          <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-6 px-5 pb-8 sm:px-8 md:grid-cols-[1fr_auto] md:items-end md:pb-12">
            <div>
              <p className="text-sm text-muted-foreground">{t.landing.kicker}</p>
              <h1 className="mt-2 max-w-[18ch] text-balance text-4xl leading-[1.1] sm:text-5xl">{t.landing.headline}</h1>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/shop" className="inline-flex min-h-12 items-center rounded-sm bg-primary px-8 text-[15px] font-medium text-primary-fg transition-transform hover:-translate-y-0.5">
                  {t.landing.storeTitle}
                </Link>
                <Link href="/creator" className="inline-flex min-h-12 items-center rounded-sm border border-fg/40 px-8 text-[15px] font-medium transition-colors hover:border-fg hover:bg-fg hover:text-bg">
                  {t.landing.creatorTitle}
                </Link>
              </div>
            </div>

            <div className="flex flex-col gap-3 md:min-w-[340px]">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={item.slug} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.4 }}>
                  <Link href={`/shop/${item.slug}`} className="group flex items-baseline justify-between gap-4">
                    <span className="font-serif text-xl underline-offset-4 group-hover:underline">{bi(item.product.title)}</span>
                    <span className="tabular-nums text-muted-foreground">{formatSar(fromPrice(item.product), locale)}</span>
                  </Link>
                </motion.div>
              </AnimatePresence>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => go(-1)} aria-label={t.landing.prev} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm border border-fg/25 hover:border-fg">
                  <svg viewBox="0 0 26 14" className="h-3.5 w-6 rtl:-scale-x-100" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M25 7H1M7 1L1 7l6 6" />
                  </svg>
                </button>
                <div className="flex flex-1 gap-1.5" role="tablist">
                  {items.map((it, k) => (
                    <button
                      key={it.slug}
                      type="button"
                      role="tab"
                      aria-selected={k === i}
                      aria-label={bi(it.product.title)}
                      onClick={() => {
                        setDir(k > i ? 1 : -1);
                        setI(k);
                      }}
                      className="group flex h-11 flex-1 items-center"
                    >
                      <span className="relative block h-[2px] w-full overflow-hidden bg-fg/15 transition-transform group-hover:scale-y-150">
                        <span
                          key={k === i ? `${i}-${playing && !hover}` : "x"}
                          className={`absolute inset-0 origin-left bg-fg rtl:origin-right ${k < i ? "scale-x-100 opacity-40" : k === i ? (playing && !hover && !reduce ? "hero-fill" : "scale-x-100") : "scale-x-0"}`}
                          style={{ animationDuration: `${SPEED}ms` }}
                        />
                      </span>
                    </button>
                  ))}
                </div>
                <button type="button" onClick={() => go(1)} aria-label={t.landing.next} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm border border-fg/25 hover:border-fg">
                  <svg viewBox="0 0 26 14" className="h-3.5 w-6 rtl:-scale-x-100" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M1 7h24M19 1l6 6-6 6" />
                  </svg>
                </button>
                <button type="button" onClick={() => setPlaying((p) => !p)} aria-pressed={playing} aria-label={playing ? t.landing.pause : t.landing.play} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm hover:bg-fg/10">
                  {playing ? (
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
                      <path d="M6.5 4.5h3.5v15H6.5zM14 4.5h3.5v15H14z" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
                      <path d="M7 4.5v15l12.5-7.5z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </section>

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
