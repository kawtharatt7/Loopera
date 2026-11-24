"use client";

import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLayoutEffect, useRef, useState } from "react";
import { useT } from "@/lib/i18n/client";
import { formatSar, getProduct } from "@/lib/shop/catalog";

/*
  The opening, told while scrolling (GSAP ScrollTrigger, pinned for four screens):

  1. A closed crochet cocoon (wrapped in a real macro photo of our own cocoa stitches) splits into
     two halves and the signature bag floats out of it.
  2. The bag glides to the side while strands of plied yarn run across the frame toward it.
  3. A real open-mesh stitch (from the cream poncho) closes in as a lens; the view zooms through
     its loop, out of focus, onto the rest of the collection.
  4. The camera settles on a sunlit linen table: the same bag in Mini, Midi and Maxi.

  Every object on screen is one of our own photographed pieces. Reduced motion gets a still
  version with the same content, and nothing pins.
*/

gsap.registerPlugin(ScrollTrigger);

const HERO = "wine-shell-bag";
const COLLECTION = [
  "/photos/cutout/checker-dress.webp",
  "/photos/cutout/teal-handbag-u2.webp",
  "/photos/cutout/white-poncho.webp",
  "/photos/cutout/star-flower-bag.webp",
  "/photos/cutout/graduation-bouquet.webp",
  "/photos/cutout/green-mesh-poncho.webp",
  "/photos/cutout/bow-bag.webp",
  "/photos/cutout/yellow-mesh-poncho.webp",
];
const TRIO_SCALE = [0.62, 0.8, 1];

// Three strands of plied yarn crossing from the far side toward the bag (viewBox 0 0 1000 600).
const STRANDS = [
  { d: "M1060,400 C900,330 780,470 640,420 C520,378 470,330 380,320", color: "rgb(var(--terracotta))", w: 9 },
  { d: "M1060,500 C880,470 800,560 660,500 C560,456 490,380 400,345", color: "rgb(var(--sage))", w: 7 },
  { d: "M1060,585 C900,610 780,520 650,545 C530,568 470,430 390,370", color: "#D9C3A5", w: 8 },
];

export function ScrollHero() {
  const { t, bi, locale } = useT();
  const s = t.landing.scroll;
  const root = useRef<HTMLElement | null>(null);
  const [still, setStill] = useState(false);
  const bag = getProduct(HERO);
  const heroSrc = bag?.cutout ?? "/photos/cutout/wine-shell-bag.webp";
  const sizes = bag?.sizes ?? [];

  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) {
      setStill(true);
      return;
    }
    const side = document.documentElement.dir === "rtl" ? -1 : 1; // "start" is left in English, right in Arabic
    const wide = window.innerWidth >= 768;
    const q = gsap.utils.selector(el);

    const ctx = gsap.context(() => {
      // Strand lengths, so they can be drawn in.
      q<SVGPathElement>("[data-strand]").forEach((p) => {
        const len = p.getTotalLength();
        gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
      });
      gsap.set(q("[data-hero]"), { scale: 0.55, autoAlpha: 0, y: 30 });
      gsap.set(q("[data-s2], [data-s3], [data-s4]"), { autoAlpha: 0 });
      gsap.set(q("[data-lens]"), { autoAlpha: 0, scale: 0.55 });
      gsap.set(q("[data-collection]"), { autoAlpha: 0, scale: 1.12, filter: "blur(10px)" });
      gsap.set(q("[data-table]"), { yPercent: 100 });
      gsap.set(q("[data-trio]"), { yPercent: 40, autoAlpha: 0 });

      const tl = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: "+=420%",
          pin: q("[data-pin]")[0],
          scrub: 0.9,
          onUpdate: (st) => el.style.setProperty("--progress", st.progress.toFixed(3)),
        },
      });

      // 1 — the cocoon splits, the bag floats out
      tl.to(q("[data-hint]"), { autoAlpha: 0, duration: 0.3 }, 0)
        .to(q("[data-half='a']"), { xPercent: -95, x: -window.innerWidth * 0.18, rotate: -16, duration: 1.8 }, 0.1)
        .to(q("[data-half='b']"), { xPercent: 95, x: window.innerWidth * 0.18, rotate: 16, duration: 1.8 }, 0.1)
        .to(q("[data-half]"), { autoAlpha: 0, duration: 0.6 }, 1.5)
        .to(q("[data-hero]"), { scale: 1, autoAlpha: 1, y: 0, duration: 1.4, ease: "power3.out" }, 0.4)
        .to(q("[data-s1]"), { yPercent: -40, autoAlpha: 0, duration: 0.8 }, 2.1);

      // 2 — the bag glides to the side, strands run toward it
      tl.addLabel("s2", 2.3)
        .to(q("[data-hero]"), wide ? { x: -side * window.innerWidth * 0.2, scale: 0.92, duration: 1.4 } : { y: -window.innerHeight * 0.12, scale: 0.8, duration: 1.4 }, "s2")
        .to(q("[data-strands]"), { autoAlpha: 1, duration: 0.3 }, "s2")
        .to(q("[data-strand]"), { strokeDashoffset: 0, duration: 1.8, stagger: 0.18, ease: "power1.inOut" }, "s2+=0.2")
        .fromTo(q("[data-s2]"), { autoAlpha: 0, x: side * 40 }, { autoAlpha: 1, x: 0, duration: 0.9 }, "s2+=0.6");

      // 3 — the stitch lens closes in, the camera zooms through its loop
      tl.addLabel("s3", 4.7)
        .to(q("[data-s2]"), { autoAlpha: 0, duration: 0.5 }, "s3")
        .to(q("[data-strands]"), { autoAlpha: 0, duration: 0.6 }, "s3")
        .to(q("[data-lens]"), { autoAlpha: 1, scale: 1, duration: 1.1, ease: "power2.out" }, "s3")
        .to(q("[data-hero]"), { autoAlpha: 0, scale: 0.7, duration: 0.8 }, "s3+=0.5")
        .to(q("[data-collection]"), { autoAlpha: 1, duration: 0.6 }, "s3+=0.7")
        .to(q("[data-lens]"), { scale: 7, filter: "blur(6px)", duration: 1.5, ease: "power2.in" }, "s3+=1.3")
        .to(q("[data-collection]"), { scale: 1, filter: "blur(0px)", duration: 1.3 }, "s3+=1.4")
        .to(q("[data-lens]"), { autoAlpha: 0, duration: 0.3 }, "s3+=2.6")
        .fromTo(q("[data-s3]"), { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.7 }, "s3+=2.4");

      // 4 — back out onto the sunlit table: one bag in three sizes
      tl.addLabel("s4", 8)
        .to(q("[data-s3]"), { autoAlpha: 0, y: -20, duration: 0.5 }, "s4")
        .to(q("[data-collection]"), { yPercent: -30, autoAlpha: 0, scale: 0.9, duration: 1 }, "s4")
        .to(q("[data-table]"), { yPercent: 0, duration: 1.2, ease: "power3.out" }, "s4+=0.2")
        .to(q("[data-trio]"), { yPercent: 0, autoAlpha: 1, duration: 1, stagger: 0.15, ease: "power3.out" }, "s4+=0.6")
        .fromTo(q("[data-s4]"), { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.8 }, "s4+=0.9")
        .to({}, { duration: 0.6 });
    }, el);

    const onChange = () => media.matches && setStill(true);
    media.addEventListener("change", onChange);
    return () => {
      media.removeEventListener("change", onChange);
      ctx.revert();
    };
  }, [locale]);

  if (still) return <StillHero heroSrc={heroSrc} />;

  const trio = (
    <div className="flex h-full items-end justify-center gap-[4vw]">
      {sizes.slice(0, 3).map((size, i) => (
        <div key={size.id} data-trio className="flex flex-col items-center" style={{ width: `calc(${TRIO_SCALE[i]} * min(28vw, 44vh))` }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- local cut-out, sized by its column */}
          <img src={heroSrc} alt={`${bag ? bi(bag.title) : ""}, ${bi(size.label)}`} className="h-auto w-full object-contain [filter:drop-shadow(0_26px_22px_rgb(60_30_10/0.28))_drop-shadow(-3px_-4px_0_rgb(255_214_160/0.35))]" draggable={false} />
          <span aria-hidden="true" className="-mt-2 h-3 w-3/4 rounded-[50%] bg-[rgb(60_30_10/0.25)] blur-md" />
          <p className="mt-3 font-serif text-lg">{bi(size.label)}</p>
          <p className="text-sm tabular-nums text-muted-foreground">{formatSar(size.price, locale)}</p>
        </div>
      ))}
    </div>
  );

  return (
    <section ref={root} aria-label={s.label} className="relative">
      <div data-pin className="relative h-[100svh] w-full overflow-hidden">
        <Backdrop />

        {/* 3 — the collection, seen through the loop */}
        <div data-collection aria-hidden="true" className="absolute inset-0 flex items-center justify-center will-change-transform">
          <div className="flex h-[46vh] items-end gap-[2.5vw] px-[4vw]">
            {COLLECTION.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element -- decorative cut-outs of our own pieces
              <img key={src} src={src} alt="" className="w-auto object-contain [filter:drop-shadow(0_20px_18px_rgb(60_30_10/0.22))]" style={{ height: `${[92, 62, 78, 70, 86, 64, 80, 74][i]}%` }} draggable={false} />
            ))}
          </div>
        </div>

        {/* 2 — strands of plied yarn running toward the bag */}
        <svg data-strands aria-hidden="true" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" className="pointer-events-none absolute inset-0 h-full w-full opacity-0 rtl:-scale-x-100">
          <defs>
            <filter id="yarn-soft" x="-5%" y="-5%" width="110%" height="110%">
              <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#3c1e0a" floodOpacity="0.22" />
            </filter>
          </defs>
          {STRANDS.map((st, i) => (
            <g key={st.d}>
              {/* drawn in by a mask, so the plies' twist marks stay intact */}
              <mask id={`yarn-draw-${i}`} maskUnits="userSpaceOnUse" x="0" y="0" width="1100" height="600">
                <path data-strand d={st.d} fill="none" stroke="#fff" strokeWidth={st.w * 3} strokeLinecap="round" />
              </mask>
              <g mask={`url(#yarn-draw-${i})`} filter="url(#yarn-soft)">
                <path d={st.d} fill="none" style={{ stroke: st.color }} strokeWidth={st.w} strokeLinecap="round" />
                <path d={st.d} fill="none" stroke="rgb(38 33 30 / 0.28)" strokeWidth={st.w * 0.9} strokeDasharray={`1.4 ${st.w * 0.55}`} />
                <path d={st.d} fill="none" stroke="rgb(255 255 255 / 0.32)" strokeWidth={st.w * 0.28} strokeLinecap="round" transform={`translate(0 ${-st.w * 0.22})`} />
              </g>
            </g>
          ))}
        </svg>

        {/* The signature bag */}
        <div data-hero className="absolute inset-0 flex items-center justify-center pt-[16vh] will-change-transform">
          {/* eslint-disable-next-line @next/next/no-img-element -- local cut-out */}
          <img src={heroSrc} alt={bag ? bi(bag.title) : ""} className="h-[min(44vh,46vw)] w-auto object-contain [filter:drop-shadow(0_40px_34px_rgb(60_30_10/0.30))_drop-shadow(-4px_-5px_0_rgb(255_214_160/0.35))]" draggable={false} />
        </div>

        {/* 1 — the cocoon, in two halves */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center pt-[16vh]" dir="ltr">
          <div className="relative flex h-[68vw] w-[68vw] sm:h-[min(52vmin,500px)] sm:w-[min(52vmin,500px)]">
            <CocoonHalf part="a" />
            <CocoonHalf part="b" />
          </div>
        </div>

        {/* 3 — the stitch lens: a real open-mesh stitch with one loop opened up */}
        <div data-lens aria-hidden="true" className="pointer-events-none absolute inset-[-10%] will-change-transform">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "url(/photos/texture/mesh-cream.webp)",
              backgroundSize: "min(96vmin, 820px)",
              WebkitMaskImage: "radial-gradient(circle at 50% 50%, transparent 17vmin, #000 18.5vmin)",
              maskImage: "radial-gradient(circle at 50% 50%, transparent 17vmin, #000 18.5vmin)",
            }}
          />
          <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 50% 50%, transparent 17vmin, rgb(60 30 10 / 0.45) 18.5vmin, rgb(60 30 10 / 0.08) 24vmin, transparent 40vmin)" }} />
          <div className="absolute inset-0" style={{ background: "radial-gradient(120% 90% at 30% 20%, rgb(255 222 175 / 0.35), transparent 60%)" }} />
        </div>

        {/* 4 — the linen table in window light */}
        <div data-table className="absolute inset-x-0 bottom-0 h-[58%] will-change-transform">
          <div className="absolute inset-x-0 bottom-0 h-[46%]" style={{ background: "linear-gradient(to bottom, rgb(var(--surface-2)), rgb(var(--surface)))", boxShadow: "0 -1px 0 rgb(38 33 30 / 0.08), 0 -30px 60px -30px rgb(60 30 10 / 0.25) inset" }}>
            <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='6' height='6'><g stroke='%2326211E' stroke-width='1'><path d='M0 1.5h3M3 4.5h3'/><path d='M4.5 0v3M1.5 3v3' stroke-opacity='.7'/></g></svg>\")", backgroundSize: "6px 6px" }} />
            <div className="absolute inset-0" style={{ background: "linear-gradient(105deg, transparent 20%, rgb(255 226 180 / 0.35) 32%, transparent 44%, transparent 56%, rgb(255 226 180 / 0.25) 66%, transparent 78%)" }} />
          </div>
          <div className="absolute inset-x-0 bottom-[16%] top-[2%] px-5">{trio}</div>
        </div>

        {/* Copy for each stage */}
        <div data-s1 className="pointer-events-none absolute inset-x-0 top-[15vh] z-10 px-6 text-center sm:top-[11vh]">
          <p className="text-sm tracking-wide text-muted-foreground">{s.kicker}</p>
          <h1 className="mx-auto mt-3 max-w-[18ch] text-balance text-4xl leading-[1.08] sm:text-6xl lg:text-7xl">{s.title}</h1>
        </div>
        <p data-hint className="absolute inset-x-0 bottom-8 z-10 text-center text-xs uppercase tracking-[0.25em] text-muted-foreground">
          {s.hint}
          <span aria-hidden="true" className="mx-auto mt-3 block h-8 w-px animate-pulse bg-fg/40" />
        </p>

        <div data-s2 className="absolute inset-x-6 bottom-10 z-10 max-w-md md:inset-x-auto md:bottom-auto md:end-[7vw] md:top-[18vh]">
          <p className="text-sm text-brand">{s.s2kicker}</p>
          <h2 className="mt-2 text-balance text-3xl sm:text-5xl">{s.s2title}</h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">{s.s2text}</p>
        </div>

        <div data-s3 className="pointer-events-none absolute inset-x-0 top-[15vh] sm:top-[12vh] z-10 px-6 text-center">
          <p className="text-sm text-brand">{s.s3kicker}</p>
          <h2 className="mx-auto mt-2 max-w-[20ch] text-balance text-3xl sm:text-5xl">{s.s3title}</h2>
        </div>

        <div data-s4 className="absolute inset-x-0 top-[14vh] z-10 px-6 text-center sm:top-[11vh]">
          <p className="text-sm text-brand">{s.s4kicker}</p>
          <h2 className="mt-2 text-3xl sm:text-5xl">{s.s4title}</h2>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">{s.s4text}</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link href="/shop#bags" className="inline-flex min-h-12 items-center rounded-sm bg-primary px-7 font-medium text-primary-fg hover:opacity-90">
              {s.shopBags}
            </Link>
            <Link href="/shop" className="inline-flex min-h-12 items-center rounded-sm border border-fg/30 px-7 font-medium hover:border-fg">
              {s.shopAll}
            </Link>
          </div>
        </div>

        {/* Stage ticks */}
        <div aria-hidden="true" className="absolute bottom-6 end-6 z-10 hidden h-1 w-24 overflow-hidden rounded-full bg-fg/10 sm:block">
          <span className="block h-full origin-left bg-terracotta rtl:origin-right" style={{ transform: "scaleX(var(--progress, 0))" }} />
        </div>
      </div>
    </section>
  );
}

/** Sunlit studio: raw cotton cream, warm window light from the top corner, soft falloff. */
function Backdrop() {
  return (
    <div aria-hidden="true" className="absolute inset-0 -z-0">
      <div className="absolute inset-0" style={{ background: "radial-gradient(90% 70% at 78% 8%, rgb(255 226 185 / 0.45) 0%, rgb(var(--bg)) 45%, rgb(var(--surface)) 100%)" }} />
      <div className="absolute inset-0 opacity-60" style={{ background: "linear-gradient(118deg, transparent 0 18%, rgb(255 220 170 / 0.22) 26%, transparent 34%, transparent 46%, rgb(255 220 170 / 0.16) 54%, transparent 62%)" }} />
      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='6' height='6'><g stroke='%2326211E' stroke-width='1'><path d='M0 1.5h3M3 4.5h3'/><path d='M4.5 0v3M1.5 3v3'/></g></svg>\")", backgroundSize: "6px 6px" }} />
    </div>
  );
}

/** Half of the crochet cocoon: our cocoa stitches, shaded like a sphere lit from the top left. */
function CocoonHalf({ part }: { part: "a" | "b" }) {
  const left = part === "a";
  return (
    <div
      data-half={part}
      className="relative h-full w-1/2 overflow-hidden will-change-transform"
      style={{
        borderRadius: left ? "9999px 0 0 9999px" : "0 9999px 9999px 0",
        backgroundImage: "url(/photos/texture/chunky-cocoa.webp)",
        backgroundSize: "min(24vmin, 200px)",
        backgroundPosition: left ? "right center" : "left center",
        boxShadow: "0 40px 60px -20px rgb(60 30 10 / 0.35)",
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: left
            ? "radial-gradient(circle at 70% 28%, rgb(255 225 185 / 0.35), transparent 38%), radial-gradient(circle at 100% 50%, transparent 55%, rgb(20 8 4 / 0.55) 100%)"
            : "radial-gradient(circle at -30% 28%, rgb(255 225 185 / 0.25), transparent 50%), radial-gradient(circle at 0% 50%, transparent 55%, rgb(20 8 4 / 0.6) 100%)",
        }}
      />
      {/* the seam where the halves meet */}
      <div className={`absolute inset-y-0 w-3 ${left ? "right-0" : "left-0"}`} style={{ background: `linear-gradient(to ${left ? "left" : "right"}, rgb(20 8 4 / 0.55), transparent)` }} />
    </div>
  );
}

/** Reduced motion: the same story as a still, nothing pins or moves. */
function StillHero({ heroSrc }: { heroSrc: string }) {
  const { t, bi, locale } = useT();
  const s = t.landing.scroll;
  const bag = getProduct(HERO);
  return (
    <section aria-label={s.label} className="relative overflow-hidden pt-24">
      <Backdrop />
      <div className="relative mx-auto max-w-6xl px-6 py-12 text-center">
        <p className="text-sm text-muted-foreground">{s.kicker}</p>
        <h1 className="mx-auto mt-3 max-w-[18ch] text-balance text-4xl sm:text-6xl">{s.title}</h1>
        <p className="mx-auto mt-4 max-w-md text-muted-foreground">{s.s2text}</p>
        <div className="mt-10 flex items-end justify-center gap-8">
          {(bag?.sizes ?? []).slice(0, 3).map((size, i) => (
            <div key={size.id} className="flex flex-col items-center">
              {/* eslint-disable-next-line @next/next/no-img-element -- local cut-out */}
              <img src={heroSrc} alt={`${bag ? bi(bag.title) : ""}, ${bi(size.label)}`} className="w-auto object-contain drop-shadow-[0_20px_18px_rgba(60,30,10,0.25)]" style={{ height: `${TRIO_SCALE[i] * 240}px` }} />
              <p className="mt-3 font-serif text-lg">{bi(size.label)}</p>
              <p className="text-sm tabular-nums text-muted-foreground">{formatSar(size.price, locale)}</p>
            </div>
          ))}
        </div>
        <Link href="/shop#bags" className="mt-8 inline-flex min-h-12 items-center rounded-sm bg-primary px-7 font-medium text-primary-fg hover:opacity-90">
          {s.shopBags}
        </Link>
      </div>
    </section>
  );
}
