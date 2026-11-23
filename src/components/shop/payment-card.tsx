"use client";

import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { useRef } from "react";
import { useT } from "@/lib/i18n/client";
import { BRAND_LABEL, type CardBrand } from "@/lib/shop/card";

export type CardField = "number" | "name" | "expiry" | "cvc" | null;

interface PaymentCardProps {
  number: string; // already formatted with spaces
  name: string;
  expiry: string;
  cvc: string;
  brand: CardBrand;
  focused: CardField;
}

// Each network gets its own face, so the card visibly changes as the number is recognised.
const FACES: Record<CardBrand, string> = {
  unknown: "from-wine via-[rgb(var(--wine)/0.85)] to-ember",
  visa: "from-[rgb(var(--wine))] via-[rgb(110_24_40)] to-[rgb(40_14_30)]",
  mastercard: "from-ember via-wine to-[rgb(40_12_16)]",
  mada: "from-[rgb(20_70_70)] via-[rgb(30_95_85)] to-wine",
  amex: "from-[rgb(40_80_110)] via-[rgb(60_100_130)] to-wine",
};

function Chip() {
  return (
    <svg viewBox="0 0 46 34" className="h-9 w-12" aria-hidden="true">
      <rect x="1" y="1" width="44" height="32" rx="6" className="fill-[rgb(226_190_120)]" />
      <path d="M1 12h14M1 22h14M31 12h14M31 22h14M15 1v32M31 1v32M15 17h16" className="stroke-[rgb(150_110_50)]" strokeWidth="1.2" fill="none" />
    </svg>
  );
}

function Digits({ text, placeholder }: { text: string; placeholder: string }) {
  const shown = text.padEnd(placeholder.length, " ");
  return (
    <span className="inline-flex" aria-hidden="true">
      {shown.split("").map((ch, i) => {
        const empty = ch === " " && placeholder[i] !== " ";
        return (
          <span key={i} className="relative inline-block w-[0.62em] text-center">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={empty ? `p${i}` : `${ch}${i}`}
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: empty ? 0.45 : 1 }}
                exit={{ y: 10, opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="inline-block"
              >
                {empty ? placeholder[i] : ch === " " ? " " : ch}
              </motion.span>
            </AnimatePresence>
          </span>
        );
      })}
    </span>
  );
}

/**
 * A card that fills in as the buyer types: it recognises the network, flips to show the CVC,
 * tilts toward the pointer and catches a sweep of light. It only displays; it stores nothing.
 */
export function PaymentCard({ number, name, expiry, cvc, brand, focused }: PaymentCardProps) {
  const reduce = useReducedMotion() ?? false;
  const { t } = useT();
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-1, 1], [9, -9]), { stiffness: 160, damping: 18 });
  const ry = useSpring(useTransform(mx, [-1, 1], [-12, 12]), { stiffness: 160, damping: 18 });
  const glareX = useTransform(mx, [-1, 1], ["20%", "80%"]);
  const flipped = focused === "cvc";
  const placeholder = brand === "amex" ? "•••• •••••• •••••" : "•••• •••• •••• ••••";

  const onMove = (e: React.PointerEvent) => {
    if (reduce || e.pointerType !== "mouse") return;
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    mx.set(((e.clientX - r.left) / r.width) * 2 - 1);
    my.set(((e.clientY - r.top) / r.height) * 2 - 1);
  };

  const face = `absolute inset-0 overflow-hidden rounded-[18px] bg-gradient-to-br ${FACES[brand]} text-[rgb(255_244_238)] shadow-[0_30px_60px_-25px_rgb(0_0_0/0.7)] [backface-visibility:hidden] transition-[background-image] duration-500`;

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={() => {
        mx.set(0);
        my.set(0);
      }}
      className="mx-auto w-full max-w-[400px] [perspective:1200px]"
      dir="ltr"
      role="img"
      aria-label={`${BRAND_LABEL[brand]} ending ${number.replace(/\D/g, "").slice(-4) || "not entered yet"}`}
    >
      <motion.div style={{ rotateX: reduce ? 0 : rx, rotateY: reduce ? 0 : ry }} className="[transform-style:preserve-3d]">
        <motion.div
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 120, damping: 16 }}
          className="relative aspect-[1.586] w-full [transform-style:preserve-3d]"
        >
          {/* Front */}
          <div className={face}>
            {/* slow moving light, like foil */}
            <motion.div
              aria-hidden="true"
              className="absolute -inset-1/2 opacity-40 [background:conic-gradient(from_0deg,transparent,rgb(255_255_255/0.18),transparent_30%,rgb(243_182_182/0.25),transparent_60%)]"
              animate={reduce ? undefined : { rotate: 360 }}
              transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
            />
            <motion.div aria-hidden="true" className="absolute inset-0 [background:radial-gradient(circle_at_var(--gx)_30%,rgb(255_255_255/0.22),transparent_45%)]" style={{ ["--gx" as string]: glareX }} />
            <div className="relative flex h-full flex-col justify-between p-[7%]">
              <div className="flex items-start justify-between">
                <span className="font-serif text-xl">Loopera</span>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={brand}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    className={`text-lg font-bold ${brand === "visa" ? "italic tracking-wide" : brand === "mada" ? "lowercase" : ""}`}
                  >
                    {brand === "unknown" ? "" : BRAND_LABEL[brand]}
                  </motion.span>
                </AnimatePresence>
              </div>
              <div className="flex items-center gap-3">
                <Chip />
                <svg viewBox="0 0 24 24" className="h-6 w-6 opacity-80" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                  <path d="M8.5 7.5a7 7 0 0 1 0 9M12 5a10.5 10.5 0 0 1 0 14M5 10a3 3 0 0 1 0 4" />
                </svg>
              </div>
              <div className={`font-mono text-[clamp(1rem,5.4vw,1.45rem)] tracking-wide transition-opacity ${focused === "number" ? "opacity-100" : "opacity-95"}`}>
                <Digits text={number} placeholder={placeholder} />
              </div>
              <div className="flex items-end justify-between gap-4 text-sm">
                <div className="min-w-0">
                  <p className="text-[10px] opacity-70">{t.checkout.cardHolder}</p>
                  <p className={`truncate uppercase ${focused === "name" ? "underline decoration-rose underline-offset-4" : ""}`}>{name || t.checkout.yourName}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[10px] opacity-70">{t.checkout.expires}</p>
                  <p className={`font-mono ${focused === "expiry" ? "underline decoration-rose underline-offset-4" : ""}`}>{expiry || "MM/YY"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Back */}
          <div className={`${face} [transform:rotateY(180deg)]`}>
            <div className="mt-[9%] h-[18%] w-full bg-[rgb(20_8_10)]" />
            <div className="mx-[7%] mt-[7%] flex h-[16%] items-center justify-end rounded bg-[repeating-linear-gradient(-45deg,rgb(255_246_241),rgb(255_246_241)_6px,rgb(240_226_220)_6px,rgb(240_226_220)_12px)] pr-4">
              <span className="font-mono text-lg tracking-[0.2em] text-[rgb(43_15_20)]">{cvc.padEnd(brand === "amex" ? 4 : 3, "•")}</span>
            </div>
            <p className="mx-[7%] mt-4 text-[11px] leading-snug opacity-75">{t.checkout.testOnly}</p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
