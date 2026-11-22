"use client";

import { motion } from "framer-motion";

const ITEMS = [
  { name: "Bear plush", price: "SAR 120", fill: "fill-blush" },
  { name: "Bunny plush", price: "SAR 95", fill: "fill-sage" },
  { name: "Kitty plush", price: "SAR 70", fill: "fill-butter" },
] as const;

// What you see behind the Shop door: little product cards rising into place.
export function ShopPreview({ open }: { open: boolean }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-8 pt-16">
      {ITEMS.map((item, index) => (
        <motion.div
          key={item.name}
          initial={false}
          animate={{ opacity: open ? 1 : 0, y: open ? 0 : 18 }}
          transition={{ duration: 0.45, delay: open ? 0.25 + index * 0.12 : 0 }}
          className="flex w-full max-w-[16rem] items-center gap-3 rounded-3xl border border-cocoa/10 bg-cream p-3"
        >
          <svg viewBox="0 0 48 48" className="h-12 w-12 shrink-0" strokeWidth="1.5">
            <circle cx="14" cy="12" r="6" className={`${item.fill} stroke-cocoa/40`} />
            <circle cx="34" cy="12" r="6" className={`${item.fill} stroke-cocoa/40`} />
            <circle cx="24" cy="27" r="16" className={`${item.fill} stroke-cocoa/40`} />
            <circle cx="19" cy="25" r="1.8" className="fill-cocoa" />
            <circle cx="29" cy="25" r="1.8" className="fill-cocoa" />
            <ellipse cx="24" cy="31" rx="4" ry="3" className="fill-cream" />
          </svg>
          <div className="min-w-0 flex-1 text-left">
            <p className="truncate font-serif text-base">{item.name}</p>
            <p className="text-sm text-cocoa/75">{item.price}</p>
          </div>
          <span className="text-berry">♥</span>
        </motion.div>
      ))}
    </div>
  );
}
