"use client";

import { useEffect, useRef, useState } from "react";
import { CustomOrderDrawer } from "@/components/custom/custom-order";
import { useC } from "@/lib/i18n/collection";

/*
  The opening: a full-bleed film (yarn spool, the sweater forming stitch by stitch, the finished
  sweater) that plays muted on a loop. The poster stands in until it can play, and stays if the
  visitor prefers reduced motion. One small control pauses or plays it.
*/

const VIDEO = "/videos/hero-loop.mp4";
const POSTER = "/videos/hero-loop-poster.jpg";

export function ScrollHero() {
  const c = useC();
  const h = c.hero;
  const video = useRef<HTMLVideoElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [crochet, setCrochet] = useState(false);

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    v.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }, []);

  const toggle = () => {
    const v = video.current;
    if (!v) return;
    if (v.paused) v.play().then(() => setPlaying(true)).catch(() => undefined);
    else {
      v.pause();
      setPlaying(false);
    }
  };
  const openStore = () => document.getElementById("shop")?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <section aria-label={h.label} className="relative h-[min(92svh,900px)] min-h-[520px] w-full overflow-hidden bg-[#EFE6D6] text-[#26211E]">
      <video ref={video} src={VIDEO} poster={POSTER} muted loop playsInline preload="auto" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />
      <div aria-hidden="true" className="absolute inset-0" style={{ background: "linear-gradient(to right, rgb(250 247 242 / 0.9) 0%, rgb(250 247 242 / 0.6) 34%, transparent 62%)" }} />
      <div aria-hidden="true" className="absolute inset-0 rtl:-scale-x-100" style={{ background: "linear-gradient(to top, rgb(250 247 242 / 0.7), transparent 30%)" }} />

      <div className="relative flex h-full max-w-7xl flex-col justify-end px-6 pb-16 sm:px-10 md:justify-center md:pb-0">
        <p className="text-sm tracking-wide opacity-75">{h.kicker}</p>
        <h1 className="mt-3 max-w-[14ch] text-balance text-4xl leading-[1.05] sm:text-6xl lg:text-7xl">{h.title}</h1>
        <p className="mt-4 max-w-md leading-relaxed opacity-80">{h.s3text}</p>
        <div className="mt-7 flex flex-wrap gap-3">
          <button type="button" onClick={openStore} className="stitch inline-flex min-h-12 items-center rounded-sm bg-[#A44F36] px-7 font-medium text-white shadow-[0_14px_30px_-14px_rgba(120,50,30,0.8)] hover:bg-[#8F4430]">
            {h.openStore}
          </button>
          <button type="button" onClick={() => setCrochet(true)} className="inline-flex min-h-12 items-center rounded-sm border border-[#26211E]/40 bg-[#FAF7F2]/85 px-7 font-medium backdrop-blur hover:border-[#26211E]">
            {h.iCrochet}
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={toggle}
        aria-pressed={playing}
        aria-label={playing ? c.pauseVideo : c.playVideo}
        className="absolute bottom-5 end-5 grid h-11 w-11 place-items-center rounded-full border border-[#26211E]/20 bg-[#FAF7F2]/80 backdrop-blur hover:border-[#26211E]"
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
          <path d={playing ? "M6.5 4.5h3.5v15H6.5zM14 4.5h3.5v15H14z" : "M7 4.5v15l12.5-7.5z"} />
        </svg>
      </button>
      <CustomOrderDrawer open={crochet} onClose={() => setCrochet(false)} kind="general" />
    </section>
  );
}
