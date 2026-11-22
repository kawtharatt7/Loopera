"use client";

import { motion, useReducedMotion } from "framer-motion";

// Two strands of yarn that draw themselves behind the page (stroke-dashoffset
// style animation via Framer Motion's pathLength).
export function YarnLine({ className }: { className?: string }) {
  const reduce = useReducedMotion();

  return (
    <svg
      viewBox="0 0 1200 1000"
      preserveAspectRatio="none"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <motion.path
        d="M -40 140 C 160 40 300 260 420 170 S 560 60 600 200 S 420 420 330 560 S 300 800 380 1040"
        className="stroke-blush"
        strokeWidth={7}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        initial={reduce ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 3, delay: 0.3, ease: "easeInOut" }}
      />
      <motion.path
        d="M 1240 220 C 1040 120 900 340 800 260 S 700 120 640 260 S 820 480 900 620 S 940 860 860 1040"
        className="stroke-berry/60"
        strokeWidth={3.5}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        initial={reduce ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 3, delay: 0.8, ease: "easeInOut" }}
      />
    </svg>
  );
}
