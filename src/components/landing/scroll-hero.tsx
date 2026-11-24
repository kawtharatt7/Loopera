"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLayoutEffect, useRef, useState } from "react";
import { CustomOrderDrawer } from "@/components/custom/custom-order";
import { useC } from "@/lib/i18n/collection";

/*
  The opening, told while scrolling (GSAP ScrollTrigger, pinned for four screens) over the sunlit
  linen table:

  1. The spark: a cream and terracotta yarn ball and a carved wooden hook on the table.
  2. The creation: the hook glides across, golden yarn threads run from the ball, and a crochet
     sweater builds up row by row.
  3. The transition: the camera pulls back from the stitches and the sweater is on a model in the studio.
  4. The prompt: Open Store, or tell us what to crochet.

  Reduced motion gets a still version with the same content.
*/

gsap.registerPlugin(ScrollTrigger);

const BG = "/images/hero/linen-table-bg.jpg";
const BALL = "/images/hero/yarn-ball.png";
const HOOK = "/images/hero/crochet-hook.png";
const MODEL = "/images/clothes/star-bell-sleeve-sweater.webp";
const INK = "text-[#26211E]";

// Golden and cream threads from the yarn ball (bottom start) to the sweater (viewBox 0 0 1000 600).
const THREADS = [
  { d: "M210,520 C330,470 420,520 520,430 C590,370 600,300 640,250", color: "#D9B46A", w: 5 },
  { d: "M230,540 C380,560 470,470 560,420 C620,388 650,330 690,290", color: "#EFE3CC", w: 6 },
  { d: "M200,500 C300,420 360,380 470,360 C560,344 600,300 610,230", color: "#C98F4E", w: 4 },
  { d: "M250,550 C420,600 560,520 640,440 C690,390 720,350 740,330", color: "#E8D2A6", w: 5 },
];

export function ScrollHero() {
  const c = useC();
  const h = c.hero;
  const root = useRef<HTMLElement | null>(null);
  const [still, setStill] = useState(false);
  const [crochet, setCrochet] = useState(false);

  const openStore = () => document.getElementById("shop")?.scrollIntoView({ behavior: "smooth", block: "start" });

  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) {
      setStill(true);
      return;
    }
    const side = document.documentElement.dir === "rtl" ? -1 : 1;
    const W = window.innerWidth;
    const H = window.innerHeight;
    const wide = W >= 768;
    const q = gsap.utils.selector(el);

    const ctx = gsap.context(() => {
      q<SVGPathElement>("[data-thread]").forEach((p) => {
        const len = p.getTotalLength();
        gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
      });
      gsap.set(q("[data-s2], [data-s3], [data-s4]"), { autoAlpha: 0 });
      gsap.set(q("[data-frame]"), { autoAlpha: 0, clipPath: "inset(100% 0% 0% 0%)" });
      gsap.set(q("[data-model]"), { scale: 2.5, transformOrigin: "52% 38%" });
      gsap.set(q("[data-studio]"), { autoAlpha: 0 });

      const tl = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        scrollTrigger: { trigger: el, start: "top top", end: "+=400%", pin: q("[data-pin]")[0], scrub: 0.9 },
      });

      // Parallax on the table the whole way through.
      tl.to(q("[data-bg]"), { scale: 1, yPercent: -4, duration: 8, ease: "none" }, 0);

      // 2 — the hook glides, threads run, the sweater builds row by row
      tl.to(q("[data-hint]"), { autoAlpha: 0, duration: 0.3 }, 0)
        .to(q("[data-s1]"), { autoAlpha: 0, y: -30, duration: 0.7 }, 0.5)
        .to(q("[data-hook]"), { x: -side * W * (wide ? 0.05 : 0.1), y: -H * (wide ? 0.1 : 0.04), rotate: -side * 10, scale: wide ? 0.8 : 0.7, duration: 2.2 }, 0.4)
        .to(q("[data-ball]"), { x: -side * W * 0.03, y: H * 0.02, rotate: -20, duration: 2.2 }, 0.4)
        .to(q("[data-threads]"), { autoAlpha: 1, duration: 0.2 }, 0.7)
        .to(q("[data-thread]"), { strokeDashoffset: 0, duration: 1.6, stagger: 0.15, ease: "power1.inOut" }, 0.8)
        .to(q("[data-frame]"), { autoAlpha: 1, duration: 0.2 }, 1.3)
        .to(q("[data-frame]"), { clipPath: "inset(0% 0% 0% 0%)", duration: 1.6, ease: "steps(14)" }, 1.4)
        .fromTo(q("[data-s2]"), { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.7 }, 1.5);

      // 3 — pull back from the stitches: the sweater is on a model in the warm studio
      tl.addLabel("s3", 3.4)
        .to(q("[data-s2]"), { autoAlpha: 0, duration: 0.5 }, "s3")
        .to(q("[data-hook], [data-ball], [data-threads]"), { autoAlpha: 0, duration: 0.7 }, "s3")
        .to(q("[data-studio]"), { autoAlpha: 1, duration: 1.2 }, "s3")
        .to(q("[data-model]"), { scale: 1, duration: 1.8, ease: "power2.inOut" }, "s3+=0.1")
        .to(q("[data-frame]"), wide ? { x: side * W * 0.16, height: "76vh", duration: 1.8 } : { height: "58vh", y: -H * 0.04, duration: 1.8 }, "s3+=0.1")
        .fromTo(q("[data-s3]"), { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.7 }, "s3+=1.1");

      // 4 — the prompt
      tl.addLabel("s4", 6)
        .to(q("[data-s3]"), { autoAlpha: 0, y: -16, duration: 0.5 }, "s4")
        .fromTo(q("[data-s4]"), { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.8 }, "s4+=0.3")
        .to({}, { duration: 1 });
    }, el);

    return () => ctx.revert();
  }, []);

  const buttons = (
    <div className="mt-6 flex flex-wrap gap-3">
      <button type="button" onClick={openStore} className="inline-flex min-h-12 items-center gap-2 rounded-sm bg-[#A44F36] px-7 font-medium text-white shadow-[0_14px_30px_-14px_rgba(120,50,30,0.8)] hover:bg-[#8F4430]">
        {h.openStore}
        <span className="text-sm opacity-70">/ {h.openStoreAlt}</span>
      </button>
      <button type="button" onClick={() => setCrochet(true)} className={`inline-flex min-h-12 items-center gap-2 rounded-sm border border-[#26211E]/40 bg-[#FAF7F2]/80 px-7 font-medium backdrop-blur hover:border-[#26211E] ${INK}`}>
        {h.iCrochet}
        <span className="text-sm opacity-60">/ {h.iCrochetAlt}</span>
      </button>
    </div>
  );

  if (still)
    return (
      <section aria-label={h.label} className={`relative overflow-hidden pt-24 ${INK}`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- decorative backdrop */}
        <img src={BG} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-[#FAF7F2]/75" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-6 py-14 md:grid-cols-2">
          <div>
            <p className="text-sm opacity-70">{h.kicker}</p>
            <h1 className="mt-3 text-balance text-4xl sm:text-6xl">{h.title}</h1>
            <p className="mt-4 max-w-md opacity-75">{h.s3text}</p>
            {buttons}
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element -- local photo */}
          <img src={MODEL} alt="" className="mx-auto max-h-[60vh] rounded-sm shadow-xl" />
        </div>
        <CustomOrderDrawer open={crochet} onClose={() => setCrochet(false)} kind="general" />
      </section>
    );

  return (
    <section ref={root} aria-label={h.label} className={`relative ${INK}`}>
      <div data-pin className="relative h-[100svh] w-full overflow-hidden bg-[#EFE6D6]">
        {/* The sunlit linen table */}
        {/* eslint-disable-next-line @next/next/no-img-element -- decorative backdrop, full bleed */}
        <img data-bg src={BG} alt="" className="absolute inset-0 h-full w-full scale-110 object-cover will-change-transform" />
        <div aria-hidden="true" className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgb(250 247 242 / 0.88) 0%, rgb(250 247 242 / 0.55) 30%, rgb(250 247 242 / 0.05) 60%, rgb(38 33 30 / 0.12) 100%)" }} />
        {/* The warm studio the sweater ends up in */}
        <div data-studio aria-hidden="true" className="absolute inset-0" style={{ background: "radial-gradient(90% 70% at 70% 30%, #F6EAD6 0%, #EADBC3 55%, #DCC8AB 100%)" }} />

        {/* Golden threads from the ball to the sweater */}
        <svg data-threads aria-hidden="true" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" className="pointer-events-none absolute inset-0 h-full w-full opacity-0 rtl:-scale-x-100">
          <defs>
            <filter id="thread-shadow" x="-5%" y="-5%" width="110%" height="110%">
              <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#3c1e0a" floodOpacity="0.25" />
            </filter>
          </defs>
          {THREADS.map((t) => (
            <g key={t.d} filter="url(#thread-shadow)">
              <path data-thread d={t.d} fill="none" stroke={t.color} strokeWidth={t.w} strokeLinecap="round" />
            </g>
          ))}
        </svg>

        {/* The sweater: first only its stitches, close up; then the whole look */}
        <div className="absolute inset-0 flex items-center justify-center pt-[6vh]">
          <div data-frame className="relative aspect-[680/762] h-[52vh] overflow-hidden rounded-sm shadow-[0_40px_70px_-30px_rgba(60,30,10,0.55)] will-change-transform">
            {/* eslint-disable-next-line @next/next/no-img-element -- local photo */}
            <img data-model src={MODEL} alt="" className="h-full w-full object-cover will-change-transform" />
          </div>
        </div>

        {/* The spark: yarn ball and hook on the table */}
        {/* eslint-disable-next-line @next/next/no-img-element -- local cut-out */}
        <img data-ball src={BALL} alt="" className="absolute bottom-[10vh] start-[8vw] w-[min(34vw,340px)] drop-shadow-[0_30px_24px_rgba(60,30,10,0.4)] will-change-transform" draggable={false} />
        {/* eslint-disable-next-line @next/next/no-img-element -- local cut-out */}
        <img data-hook src={HOOK} alt="" className="absolute bottom-[16vh] end-[4vw] w-[min(46vw,560px)] drop-shadow-[0_30px_24px_rgba(60,30,10,0.4)] will-change-transform rtl:-scale-x-100" draggable={false} />

        {/* Copy */}
        <div data-s1 className="absolute inset-x-0 top-[15vh] z-10 px-6 text-center sm:top-[13vh]">
          <p className="text-sm tracking-wide opacity-70">{h.kicker}</p>
          <h1 className="mx-auto mt-3 max-w-[16ch] text-balance text-4xl leading-[1.06] sm:text-6xl lg:text-7xl">{h.title}</h1>
        </div>
        <p data-hint className="absolute inset-x-0 bottom-6 z-10 text-center text-xs uppercase tracking-[0.25em] opacity-70">
          {h.hint}
          <span aria-hidden="true" className="mx-auto mt-2 block h-7 w-px animate-pulse bg-[#26211E]/50" />
        </p>

        <div data-s2 className="absolute inset-x-6 top-[14vh] z-10 max-w-sm md:inset-x-auto md:start-[6vw] md:top-[16vh]">
          <p className="text-sm text-[#A44F36]">{h.s2kicker}</p>
          <h2 className="mt-2 text-balance text-3xl sm:text-4xl">{h.s2title}</h2>
          <p className="mt-3 hidden leading-relaxed opacity-75 sm:block">{h.s2text}</p>
        </div>

        <div data-s3 className="absolute inset-x-6 bottom-8 z-10 max-w-md rounded-sm bg-[#FAF7F2]/80 p-5 backdrop-blur md:inset-x-auto md:bottom-auto md:start-[7vw] md:top-1/2 md:-translate-y-1/2 md:bg-transparent md:p-0 md:backdrop-blur-0">
          <p className="text-sm text-[#A44F36]">{h.s3kicker}</p>
          <h2 className="mt-2 text-balance text-3xl sm:text-5xl">{h.s3title}</h2>
          <p className="mt-3 leading-relaxed opacity-75">{h.s3text}</p>
        </div>

        <div data-s4 className="absolute inset-x-6 bottom-8 z-10 max-w-lg rounded-sm bg-[#FAF7F2]/85 p-5 backdrop-blur md:inset-x-auto md:bottom-auto md:start-[7vw] md:top-1/2 md:-translate-y-1/2 md:bg-transparent md:p-0 md:backdrop-blur-0">
          <p className="text-sm opacity-70">{h.kicker}</p>
          <h2 className="mt-2 text-balance text-4xl sm:text-6xl">{h.s4title}</h2>
          {buttons}
        </div>
      </div>
      <CustomOrderDrawer open={crochet} onClose={() => setCrochet(false)} kind="general" />
    </section>
  );
}
