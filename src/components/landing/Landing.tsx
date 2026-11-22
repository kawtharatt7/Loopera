"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { LogoMark } from "@/components/LogoMark";
import { SITE_NAME } from "@/lib/site";
import { Door } from "./Door";
import { ShopPreview } from "./ShopPreview";
import { StudioPreview } from "./StudioPreview";
import { YarnLine } from "./YarnLine";

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const rise: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

function StudioIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-12 w-12" fill="none" aria-hidden="true">
      <circle cx="24" cy="24" r="5" className="fill-berry" />
      <circle
        cx="24"
        cy="24"
        r="12"
        className="stroke-cocoa"
        strokeWidth="2.5"
        strokeDasharray="1 6"
        strokeLinecap="round"
      />
      <circle
        cx="24"
        cy="24"
        r="19"
        className="stroke-cocoa"
        strokeWidth="2.5"
        strokeDasharray="1 7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ShopIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-12 w-12" fill="none" aria-hidden="true">
      <path
        d="M11 18h26l-2 22H13L11 18Z"
        className="fill-butter stroke-cocoa"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M17 18v-3a7 7 0 0 1 14 0v3"
        className="stroke-cocoa"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M24 33s-5-3-5-6.5a2.8 2.8 0 0 1 5-1.6 2.8 2.8 0 0 1 5 1.6C29 30 24 33 24 33Z"
        className="fill-berry"
      />
    </svg>
  );
}

export function Landing() {
  return (
    <div className="relative isolate min-h-dvh overflow-hidden">
      <YarnLine className="pointer-events-none absolute inset-0 -z-10 h-full w-full" />

      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2" aria-label={`${SITE_NAME} home`}>
          <LogoMark className="h-9 w-9" />
          <span className="font-serif text-2xl tracking-tight">{SITE_NAME}</span>
        </Link>
        <nav aria-label="Primary" className="flex items-center gap-1 text-sm font-medium">
          <Link
            href="/studio"
            className="rounded-full px-4 py-2 transition-colors hover:bg-sage/70"
          >
            Studio
          </Link>
          <Link
            href="/shop"
            className="rounded-full px-4 py-2 transition-colors hover:bg-blush/70"
          >
            Shop
          </Link>
        </nav>
      </header>

      <main id="main" className="mx-auto max-w-6xl px-5 pb-12 sm:px-8">
        <motion.section
          variants={container}
          initial="hidden"
          animate="show"
          className="mx-auto max-w-3xl pt-8 text-center sm:pt-14"
        >
          <motion.p
            variants={rise}
            className="mx-auto inline-block rounded-full bg-blush/70 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em]"
          >
            Crochet, calculated
          </motion.p>
          <motion.h1
            variants={rise}
            className="mt-6 text-balance text-4xl leading-[1.08] tracking-tight sm:text-6xl"
          >
            Patterns that add up.{" "}
            <span className="italic text-berry-dark">Pieces made by hand.</span>
          </motion.h1>
          <motion.p
            variants={rise}
            className="mx-auto mt-6 max-w-xl text-pretty text-base leading-relaxed text-cocoa/85 sm:text-lg"
          >
            {SITE_NAME} turns a photo into an exact, round-by-round crochet pattern. The AI only
            reads the picture; the code does every bit of the math. Or skip the hook and shop
            handmade pieces from makers.
          </motion.p>
        </motion.section>

        <section aria-labelledby="doors-heading" className="mx-auto mt-12 max-w-4xl sm:mt-16">
          <h2 id="doors-heading" className="sr-only">
            Choose your door
          </h2>
          <div className="grid gap-8 md:grid-cols-2 md:gap-10">
            <Door
              href="/studio"
              tone="studio"
              eyebrow="I crochet"
              title="Studio"
              description="Turn a photo or an idea into an exact pattern, and scrub through the 3D build round by round."
              cta="Open the Studio"
              icon={<StudioIcon />}
              interior={(open) => <StudioPreview open={open} />}
              delay={0.5}
            />
            <Door
              href="/shop"
              tone="shop"
              eyebrow="I want to buy"
              title="Shop"
              description="Browse handmade pieces from makers, or send your own design to one as a custom order."
              cta="Browse the Shop"
              icon={<ShopIcon />}
              interior={(open) => <ShopPreview open={open} />}
              delay={0.65}
            />
          </div>
        </section>
      </main>

      <footer className="px-5 pb-8 text-center text-sm text-cocoa/70">
        Made with yarn and math.
      </footer>
    </div>
  );
}
