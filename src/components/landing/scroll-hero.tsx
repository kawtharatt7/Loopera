"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLayoutEffect, useRef, useState } from "react";
import { CustomOrderDrawer } from "@/components/custom/custom-order";
import { useC } from "@/lib/i18n/collection";

/*
  The opening moves with the scroll: the section pins and the film's currentTime follows the
  scroll (GSAP ScrollTrigger, scrub), from the hook working the yarn to the model in the finished
  cardigan. As the film ends the screen sinks into one deep colour, and two quiet choices appear
  in the middle. Reduced motion shows that final screen directly.
*/

gsap.registerPlugin(ScrollTrigger);

const VIDEO = "/videos/hero-craft.mp4";
const POSTER = "/videos/hero-craft-poster.jpg";

export function ScrollHero() {
  const h = useC().hero;
  const root = useRef<HTMLElement | null>(null);
  const video = useRef<HTMLVideoElement | null>(null);
  const [still, setStill] = useState(false);
  const [crochet, setCrochet] = useState(false);

  const openStore = () => document.getElementById("shop")?.scrollIntoView({ behavior: "smooth", block: "start" });

  useLayoutEffect(() => {
    const el = root.current;
    const v = video.current;
    if (!el || !v) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setStill(true);
      return;
    }
    const q = gsap.utils.selector(el);
    let target = 0;
    let shown = 0;
    let raf = 0;
    // Ease the film toward the scroll position, so fast scrolls still look smooth.
    const tick = () => {
      raf = 0;
      if (!v.duration || Number.isNaN(v.duration)) return;
      shown += (target - shown) * 0.18;
      if (Math.abs(target - shown) < 0.0005) shown = target;
      const t = Math.min(v.duration - 0.05, Math.max(0, shown * v.duration));
      if (Math.abs(v.currentTime - t) > 0.008) v.currentTime = t;
      if (shown !== target) raf = requestAnimationFrame(tick);
    };
    const prime = () => v.play().then(() => v.pause()).catch(() => undefined);
    v.addEventListener("loadedmetadata", tick);
    prime();

    const ctx = gsap.context(() => {
      gsap.set(q("[data-veil], [data-choices]"), { autoAlpha: 0 });
      ScrollTrigger.create({
        trigger: el,
        start: "top top",
        end: "+=300%",
        pin: q("[data-pin]")[0],
        scrub: 0.6,
        onUpdate: (st) => {
          const p = st.progress;
          target = Math.min(1, p / 0.85);
          if (!raf) raf = requestAnimationFrame(tick);
          gsap.set(q("[data-title]"), { autoAlpha: Math.max(0, 1 - p / 0.14), y: -p * 90 });
          gsap.set(q("[data-hint]"), { autoAlpha: p < 0.03 ? 1 : 0 });
          const dark = Math.min(1, Math.max(0, (p - 0.8) / 0.12));
          gsap.set(q("[data-veil]"), { autoAlpha: dark * 0.94 });
          const c = Math.min(1, Math.max(0, (p - 0.88) / 0.1));
          gsap.set(q("[data-choices]"), { autoAlpha: c, y: (1 - c) * 18 });
        },
      });
    }, el);

    return () => {
      cancelAnimationFrame(raf);
      v.removeEventListener("loadedmetadata", tick);
      ctx.revert();
    };
  }, []);

  return (
    <section ref={root} aria-label={h.label} className="relative">
      <div data-pin className="relative h-[100svh] w-full overflow-hidden bg-[#1A1613]">
        <video
          ref={video}
          src={VIDEO}
          poster={POSTER}
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
          onLoadedData={(e) => still && (e.currentTarget.currentTime = Math.max(0, e.currentTarget.duration - 0.05))}
        />
        <div aria-hidden="true" className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgb(250 247 242 / 0.75) 0%, rgb(250 247 242 / 0.25) 30%, transparent 52%)" }} />

        {!still && (
          <>
            <div data-title className="absolute inset-x-0 top-[16vh] z-10 px-6 text-center text-[#26211E]">
              <p className="text-sm tracking-wide opacity-70">{h.kicker}</p>
              <h1 className="mx-auto mt-3 max-w-[16ch] text-balance text-4xl font-semibold leading-[1.06] sm:text-6xl lg:text-7xl">{h.title}</h1>
            </div>
            <p data-hint className="absolute inset-x-0 bottom-6 z-10 text-center text-xs uppercase tracking-[0.3em] text-white/80">
              {h.hint}
              <span aria-hidden="true" className="mx-auto mt-2 block h-7 w-px animate-pulse bg-white/60" />
            </p>
          </>
        )}

        {/* The end: one deep colour, two quiet choices in the middle */}
        <div data-veil aria-hidden="true" className="absolute inset-0 z-20 bg-[#1A1613]" style={still ? { opacity: 0.9, visibility: "visible" } : undefined} />
        <div data-choices className="absolute inset-0 z-30 flex flex-col items-center justify-center px-6 text-center text-[#F4ECE2]" style={still ? { opacity: 1, visibility: "visible" } : undefined}>
          {still && <p className="mb-4 text-sm tracking-wide opacity-70">{h.title}</p>}
          <h2 className="text-balance text-3xl font-normal tracking-tight sm:text-5xl">{h.s4title}</h2>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:gap-4">
            <button type="button" onClick={openStore} className="min-h-12 min-w-[200px] rounded-full bg-[#F4ECE2] px-8 text-[15px] font-medium text-[#1A1613] transition-transform duration-500 hover:-translate-y-0.5">
              {h.openStore}
            </button>
            <button type="button" onClick={() => setCrochet(true)} className="min-h-12 min-w-[200px] rounded-full border border-[#F4ECE2]/40 px-8 text-[15px] font-medium transition-colors duration-500 hover:border-[#F4ECE2]">
              {h.iCrochet}
            </button>
          </div>
        </div>
      </div>
      <CustomOrderDrawer open={crochet} onClose={() => setCrochet(false)} kind="general" />
    </section>
  );
}
