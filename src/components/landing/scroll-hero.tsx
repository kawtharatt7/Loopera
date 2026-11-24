"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLayoutEffect, useRef, useState } from "react";
import { CustomOrderDrawer } from "@/components/custom/custom-order";
import { useC } from "@/lib/i18n/collection";

/*
  The opening: one film, scrubbed by the scroll. The section is pinned for 250vh and the video's
  currentTime follows the scroll (GSAP ScrollTrigger, scrub 0.5): from the hook working the
  yarn on the linen table to the model wearing the finished cardigan. The title shows at the start;
  the two buttons fade in over the last 15% of the scroll.

  The file is encoded with a keyframe on every frame, so seeking is smooth in both directions.
  Reduced motion shows the last frame with the title and buttons.
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
    let raf = 0;
    const seek = () => {
      raf = 0;
      if (!v.duration || Number.isNaN(v.duration)) return;
      const t = Math.min(v.duration - 0.05, Math.max(0, target * v.duration));
      if (Math.abs(v.currentTime - t) > 0.01) v.currentTime = t;
    };
    // iOS only allows seeking once playback was started; start and pause straight away.
    const prime = () => v.play().then(() => v.pause()).catch(() => undefined);
    v.addEventListener("loadedmetadata", seek);
    prime();

    const ctx = gsap.context(() => {
      gsap.set(q("[data-end]"), { autoAlpha: 0, y: 24 });
      ScrollTrigger.create({
        trigger: el,
        start: "top top",
        end: "+=250%",
        pin: q("[data-pin]")[0],
        scrub: 0.5,
        onUpdate: (st) => {
          target = st.progress;
          if (!raf) raf = requestAnimationFrame(seek);
          gsap.set(q("[data-start]"), { autoAlpha: Math.max(0, 1 - st.progress / 0.15), y: -st.progress * 120 });
          const e = Math.min(1, Math.max(0, (st.progress - 0.85) / 0.15));
          gsap.set(q("[data-end]"), { autoAlpha: e, y: (1 - e) * 24 });
          gsap.set(q("[data-hint]"), { autoAlpha: st.progress < 0.04 ? 1 : 0 });
        },
      });
    }, el);

    return () => {
      cancelAnimationFrame(raf);
      v.removeEventListener("loadedmetadata", seek);
      ctx.revert();
    };
  }, []);

  const buttons = (
    <div className="mt-6 flex flex-wrap gap-3">
      <button type="button" onClick={openStore} className="stitch inline-flex min-h-12 items-center rounded-sm bg-[#A44F36] px-7 font-medium text-white shadow-[0_14px_30px_-14px_rgba(120,50,30,0.8)] hover:bg-[#8F4430]">
        {h.openStore}
      </button>
      <button type="button" onClick={() => setCrochet(true)} className="inline-flex min-h-12 items-center rounded-sm border border-[#26211E]/40 bg-[#FAF7F2]/85 px-7 font-medium text-[#26211E] backdrop-blur hover:border-[#26211E]">
        {h.iCrochet}
      </button>
    </div>
  );

  return (
    <section ref={root} aria-label={h.label} className="relative text-[#26211E]">
      <div data-pin className="relative h-[100svh] w-full overflow-hidden bg-[#2a2018]">
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
        <div aria-hidden="true" className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgb(250 247 242 / 0.82) 0%, rgb(250 247 242 / 0.35) 32%, transparent 55%)" }} />

        <div data-start className={`absolute inset-x-0 top-[15vh] z-10 px-6 text-center sm:top-[13vh] ${still ? "hidden" : ""}`}>
          <p className="text-sm tracking-wide opacity-75">{h.kicker}</p>
          <h1 className="mx-auto mt-3 max-w-[16ch] text-balance text-4xl leading-[1.06] sm:text-6xl lg:text-7xl">{h.title}</h1>
        </div>
        <p data-hint className={`absolute inset-x-0 bottom-6 z-10 text-center text-xs uppercase tracking-[0.25em] text-white/85 ${still ? "hidden" : ""}`}>
          {h.hint}
          <span aria-hidden="true" className="mx-auto mt-2 block h-7 w-px animate-pulse bg-white/70" />
        </p>

        <div data-end className="absolute inset-x-4 bottom-6 z-10 max-w-lg rounded-sm bg-[#FAF7F2]/90 p-6 backdrop-blur md:inset-x-auto md:bottom-12 md:start-[6vw]" style={still ? { opacity: 1, visibility: "visible" } : undefined}>
          {still && <h1 className="mb-3 text-balance text-3xl sm:text-4xl">{h.title}</h1>}
          <p className="text-sm opacity-75">{h.kicker}</p>
          <h2 className="mt-2 text-balance text-3xl sm:text-5xl">{h.s4title}</h2>
          {buttons}
        </div>
      </div>
      <CustomOrderDrawer open={crochet} onClose={() => setCrochet(false)} kind="general" />
    </section>
  );
}
