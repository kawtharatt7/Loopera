"use client";

import dynamic from "next/dynamic";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { ButtonLink } from "@/components/ui/button";
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
      className="relative isolate flex min-h-[100svh] flex-col items-center justify-end overflow-hidden px-5 pb-14 pt-24 text-center sm:pb-16"
      style={{ touchAction: "pan-y" }}
    >
      <div className="absolute inset-0 -z-10">
        {webgl === true && <YarnBallScene pointer={pointer} animate={!reduce} running={inView} compact={compact} />}
        {webgl === false && (
          <div className="flex h-full items-start justify-center pt-[12svh]">
            <YarnBallStatic className="h-[46svh] w-[46svh] max-w-[80vw]" />
          </div>
        )}
      </div>

      <motion.div variants={container} initial="hidden" animate="show" className="relative z-10 max-w-3xl">
        <motion.h1 id="hero-heading" variants={rise} className="text-balance text-5xl leading-[1.02] sm:text-7xl">
          Patterns that add up.
        </motion.h1>
        <motion.p variants={rise} className="mx-auto mt-5 max-w-lg text-pretty text-lg leading-relaxed text-muted-foreground">
          Turn a photo into a crochet pattern where every round is counted, or buy something a maker crocheted by hand.
        </motion.p>
        <motion.div variants={rise} className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/studio" size="lg">
            I crochet
          </ButtonLink>
          <ButtonLink href="/shop" size="lg" variant="secondary">
            I want to buy
          </ButtonLink>
        </motion.div>
      </motion.div>
    </section>
  );
}
