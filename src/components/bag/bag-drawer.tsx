"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { PieceImage } from "@/components/shop/piece-image";
import { useLocale, useT } from "@/lib/i18n/client";
import { formatSar, getProduct, stockFor } from "@/lib/shop/catalog";
import { cartTotal, priceOf, setQty, useCart } from "@/lib/shop/cart";
import { useBag } from "./bag-context";

/** The bag slides in from the end side (right in English, left in Arabic). */
export function BagDrawer() {
  const { open, setOpen, fresh } = useBag();
  const lines = useCart();
  const { t, bi } = useT();
  const locale = useLocale();
  const closeRef = useRef<HTMLButtonElement>(null);
  const rtl = locale === "ar";

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  const freshKey = fresh?.split("|").slice(0, 3).join("|");

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="veil"
            className="fixed inset-0 z-[60] bg-bg/50 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
          <motion.aside
            key="drawer"
            role="dialog"
            aria-modal="true"
            aria-label={t.bag.title}
            className="fixed inset-y-0 end-0 z-[70] flex w-[min(92vw,400px)] flex-col bg-surface px-6 pb-6 pt-6 shadow-2xl"
            initial={{ x: rtl ? "-101%" : "101%" }}
            animate={{ x: 0 }}
            exit={{ x: rtl ? "-101%" : "101%" }}
            transition={{ duration: 0.45, ease: [0.1, 0.85, 0.2, 1] }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl">{t.bag.title}</h2>
              <button ref={closeRef} type="button" onClick={() => setOpen(false)} aria-label={t.common.close} className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-surface-2">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </div>

            <div className="-mx-2 mt-6 flex-1 overflow-y-auto px-2">
              {lines.length === 0 ? (
                <p className="mt-24 text-center text-muted-foreground">{t.bag.empty}</p>
              ) : (
                <ul className="space-y-5">
                  {lines.map((l, i) => {
                    const p = getProduct(l.slug);
                    if (!p) return null;
                    const color = p.colors.find((c) => c.id === l.color);
                    const size = p.sizes.find((s) => s.id === l.size);
                    const max = stockFor(p, l.color, l.size);
                    const isFresh = `${l.slug}|${l.color}|${l.size}` === freshKey;
                    return (
                      <motion.li
                        key={`${l.slug}-${l.color}-${l.size}`}
                        initial={isFresh ? { opacity: 0, y: 8 } : false}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: isFresh ? 0.35 : 0, duration: 0.35 }}
                        className="flex gap-4"
                      >
                        <Link href={`/shop/${p.slug}`} onClick={() => setOpen(false)} className="relative aspect-[3/4] w-20 shrink-0 overflow-hidden rounded-md bg-surface-2">
                          <PieceImage product={p} sizes="80px" />
                        </Link>
                        <div className="flex min-w-0 flex-1 flex-col">
                          <p className="font-medium">{bi(p.title)}</p>
                          <p className="text-sm text-muted-foreground">
                            {[color && bi(color.name), size && bi(size.label)].filter(Boolean).join(locale === "ar" ? "، " : ", ")}
                          </p>
                          <div className="mt-auto flex items-center justify-between pt-2">
                            <div className="flex items-center rounded-lg border border-line/20">
                              <button type="button" aria-label={t.bag.fewer} onClick={() => setQty(i, l.qty - 1)} className="h-9 w-9">
                                −
                              </button>
                              <span className="w-6 text-center tabular-nums" aria-live="polite">
                                {l.qty}
                              </span>
                              <button type="button" aria-label={t.bag.more} disabled={l.qty >= max} onClick={() => setQty(i, l.qty + 1)} className="h-9 w-9 disabled:opacity-40">
                                +
                              </button>
                            </div>
                            <span className="tabular-nums">{formatSar(priceOf(l) * l.qty, locale)}</span>
                          </div>
                          <button type="button" onClick={() => setQty(i, 0)} className="mt-1 self-start text-sm text-muted-foreground underline underline-offset-4">
                            {t.bag.remove}
                          </button>
                        </div>
                      </motion.li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="border-t border-line/15 pt-4">
              <div className="flex justify-between text-lg">
                <span>{t.bag.subtotal}</span>
                <span className="tabular-nums">{formatSar(cartTotal(lines), locale)}</span>
              </div>
              <Link
                href="/checkout"
                onClick={() => setOpen(false)}
                aria-disabled={lines.length === 0}
                className={`mt-4 flex h-12 w-full items-center justify-center rounded-lg bg-primary font-medium text-primary-fg transition-opacity hover:opacity-90 ${lines.length === 0 ? "pointer-events-none opacity-40" : ""}`}
              >
                {t.bag.checkout}
              </Link>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
