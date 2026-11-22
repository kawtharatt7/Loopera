"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useState, type ReactNode } from "react";

export type DoorTone = "studio" | "shop";

interface DoorProps {
  href: string;
  tone: DoorTone;
  eyebrow: string;
  title: string;
  description: string;
  cta: string;
  icon: ReactNode;
  interior: (open: boolean) => ReactNode;
  delay?: number;
}

// Studio is calm and technical (sage + graph paper); Shop is warm and commercial (blush + butter).
const TONES = {
  studio: {
    frame: "border-cocoa/15 bg-cream",
    leaf: "bg-sage bg-grid",
    interior: "bg-cream bg-grid",
  },
  shop: {
    frame: "border-berry/30 bg-cream",
    leaf: "bg-gradient-to-b from-blush to-butter",
    interior: "bg-butter/40",
  },
} as const;

export function Door({
  href,
  tone,
  eyebrow,
  title,
  description,
  cta,
  icon,
  interior,
  delay = 0,
}: DoorProps) {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  const styles = TONES[tone];

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        whileHover={{ y: -6 }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
      >
        <Link
          href={href}
          aria-label={`${title}: ${description}`}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          style={{ perspective: 1400 }}
          className={`relative block h-[27rem] overflow-hidden rounded-t-[10rem] rounded-b-4xl border-2 sm:h-[30rem] ${styles.frame}`}
        >
          {/* What is behind the door */}
          <motion.div
            aria-hidden="true"
            className={`absolute inset-0 ${styles.interior}`}
            animate={{ scale: open ? 1 : 0.97 }}
            transition={{ duration: 0.5 }}
          >
            {interior(open)}
          </motion.div>

          {/* The door itself: swings open on hover or keyboard focus */}
          <motion.div
            className={`absolute inset-0 ${styles.leaf}`}
            style={{ transformOrigin: "left center", backfaceVisibility: "hidden" }}
            animate={reduce ? { opacity: open ? 0 : 1 } : { rotateY: open ? 66 : 0 }}
            transition={
              reduce ? { duration: 0.2 } : { type: "spring", stiffness: 70, damping: 15 }
            }
          >
            <div className="flex h-full flex-col justify-between p-7 pt-14 text-center sm:p-8 sm:pt-16">
              <div className="flex flex-col items-center gap-4">
                <div className="grid h-20 w-20 place-items-center rounded-full bg-cream/80">
                  {icon}
                </div>
                <span className="rounded-full bg-cream/80 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em]">
                  {eyebrow}
                </span>
                <h3 className="text-4xl sm:text-5xl">{title}</h3>
                <p className="max-w-[16rem] text-[15px] leading-relaxed text-cocoa/85">
                  {description}
                </p>
              </div>
              <span className="mx-auto inline-flex items-center gap-2 rounded-full bg-cocoa px-5 py-3 text-sm font-medium text-cream">
                {cta}
                <motion.span aria-hidden="true" animate={{ x: open ? 4 : 0 }}>
                  →
                </motion.span>
              </span>
            </div>
            <span
              aria-hidden="true"
              className="absolute right-3 top-[58%] h-4 w-4 -translate-y-1/2 rounded-full bg-berry ring-4 ring-cream/70"
            />
          </motion.div>
        </Link>
      </motion.div>
    </motion.div>
  );
}
