"use client";

import dynamic from "next/dynamic";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { ArrowIcon, ButtonLink } from "@/components/ui/button";
import { hasWebGL } from "@/lib/webgl";
import type { PointerState } from "./yarn-ball-scene";
import { YarnBallStatic } from "./yarn-ball-static";

const YarnBallScene = dynamic(() => import("./yarn-ball-scene"), { ssr: false });

const container: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } } };
const rise: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

export function YarnHero() {
  const section = useRef<HTMLElement>(null);
  const reduce = useReducedMotion() ?? false;
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const [inView, setInView] = useState(true);
  const [compact, setCompact] = useState(false);
  const pointer = useRef<PointerState>({ x: 0, y: 0, lastMove: 0, dragYaw: 0, dragPitch: 0 });

  useEffect(() => {
    setWebgl(hasWebGL());
    setCompact(window.innerWidth < 768 || (navigator.hardwareConcurrency ?? 8) <= 4);
  }, []);

  // Pause rendering when the hero scrolls out of view.
  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.02 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Mouse: the ball turns toward the pointer. Touch: dragging spins it.
  useEffect(() => {
    const el = section.current;
    if (!el) return;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "mouse") {
        pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
        pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
        pointer.current.lastMove = performance.now();
      } else if (dragging) {
        pointer.current.dragYaw += (e.clientX - lastX) * 0.01;
        pointer.current.dragPitch = Math.max(-0.6, Math.min(0.6, pointer.current.dragPitch + (e.clientY - lastY) * 0.004));
        lastX = e.clientX;
        lastY = e.clientY;
      }
    };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return;
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const onUp = () => {
      dragging = false;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("pointercancel", onUp, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, []);

  return (
    <section
      ref={section}
      aria-labelledby="hero-heading"
      className="relative isolate flex min-h-[100svh] items-end overflow-hidden pb-16 pt-28 lg:items-center lg:pb-0"
      style={{ touchAction: "pan-y" }}
    >
      {/* Soft warm glow behind the ball */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -z-20 h-[70vmin] w-[70vmin] rounded-full bg-ember/20 blur-3xl max-lg:left-1/2 max-lg:top-[12%] max-lg:-translate-x-1/2 lg:right-[8%] lg:top-1/2 lg:-translate-y-1/2"
      />
      <div aria-hidden="true" className="bg-grain pointer-events-none absolute inset-0 -z-10" />

      <div className="absolute inset-0 -z-10">
        {webgl === true && <YarnBallScene pointer={pointer} animate={!reduce} running={inView} compact={compact} />}
        {webgl === false && (
          <div className="flex h-full items-start justify-center pt-24 lg:items-center lg:justify-end lg:pr-[10%] lg:pt-0">
            <YarnBallStatic className="h-[48vmin] w-[48vmin]" />
          </div>
        )}
      </div>

      {/* Readability veil for the text side */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-[5] bg-gradient-to-t from-bg via-bg/70 to-transparent lg:bg-gradient-to-r lg:from-bg lg:via-bg/60 lg:to-transparent"
      />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative mx-auto w-full max-w-6xl px-5 sm:px-8"
      >
        <div className="max-w-xl">
          <motion.p
            variants={rise}
            className="inline-flex items-center gap-2 rounded-full border border-line/15 bg-surface/60 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-brand backdrop-blur"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-ember" aria-hidden="true" />
            Crochet, calculated
          </motion.p>
          <motion.h1
            id="hero-heading"
            variants={rise}
            className="mt-6 text-balance text-5xl leading-[1.04] tracking-tight sm:text-6xl lg:text-7xl"
          >
            Patterns that add up. <span className="italic text-peach">Pieces made by hand.</span>
          </motion.h1>
          <motion.p variants={rise} className="mt-6 max-w-md text-pretty text-lg leading-relaxed text-muted-foreground">
            Turn a photo into an exact, round-by-round crochet pattern, or shop handmade pieces from makers.
          </motion.p>
          <motion.div variants={rise} className="mt-9 flex flex-wrap gap-3">
            <ButtonLink href="/studio" size="lg">
              I crochet <ArrowIcon />
            </ButtonLink>
            <ButtonLink href="/shop" size="lg" variant="secondary">
              I want to buy
            </ButtonLink>
          </motion.div>
        </div>
      </motion.div>

      <a
        href="#places"
        className="absolute bottom-5 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-1 text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-fg lg:flex"
      >
        Scroll
        <motion.svg
          viewBox="0 0 20 20"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          aria-hidden="true"
          animate={reduce ? undefined : { y: [0, 5, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <path d="M5 8l5 5 5-5" />
        </motion.svg>
      </a>
    </section>
  );
}
