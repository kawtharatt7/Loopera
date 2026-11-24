"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { PaymentCard, type CardField } from "@/components/shop/payment-card";
import { PLANS, planOf, setSubscription, useSubscription, type Cycle, type PlanId } from "@/lib/credits/plans";
import { useT } from "@/lib/i18n/client";
import { useP } from "@/lib/i18n/pricing";
import { cvcValid, detectBrand, expiryValid, formatCardNumber, formatExpiry, luhnValid } from "@/lib/shop/card";
import { formatSar } from "@/lib/shop/catalog";

function Check() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="mt-0.5 h-4 w-4 shrink-0 text-sage" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8.5l3 3 7-7" />
    </svg>
  );
}

/** Free, Pro and Max side by side, with a monthly / yearly switch, like the plans page of an AI app. */
export function PricingPlans({ compact = false, onChosen }: { compact?: boolean; onChosen?: () => void }) {
  const p = useP();
  const { locale } = useT();
  const sub = useSubscription();
  const [cycle, setCycle] = useState<Cycle>("monthly");
  const [buying, setBuying] = useState<PlanId | null>(null);

  return (
    <div>
      <div className="flex justify-center">
        <div role="radiogroup" aria-label={p.title} className="inline-flex items-center rounded-full bg-surface p-1 ring-1 ring-line/10">
          {(["monthly", "yearly"] as Cycle[]).map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={cycle === c}
              onClick={() => setCycle(c)}
              className={`relative min-h-10 rounded-full px-5 text-sm transition-colors duration-300 ${cycle === c ? "text-bg" : "text-fg/75 hover:text-fg"}`}
            >
              {cycle === c && <motion.span layoutId="cycle-pill" className="absolute inset-0 rounded-full bg-fg" transition={{ type: "spring", stiffness: 300, damping: 30 }} />}
              <span className="relative">
                {c === "monthly" ? p.monthly : p.yearly}
                {c === "yearly" && <span className={`ms-2 rounded-full px-2 py-0.5 text-[11px] ${cycle === c ? "bg-bg/20" : "bg-sage/15 text-sage"}`}>{p.save}</span>}
              </span>
            </button>
          ))}
        </div>
      </div>

      <ul className={`mt-10 grid gap-5 ${compact ? "lg:grid-cols-3" : "md:grid-cols-3"}`}>
        {PLANS.map((plan) => {
          const popular = plan.id === "pro";
          const mine = sub.plan === plan.id;
          const price = cycle === "monthly" ? plan.monthly : Math.round((plan.yearly / 12) * 10) / 10;
          return (
            <li
              key={plan.id}
              className={`relative flex flex-col rounded-3xl p-7 transition-shadow duration-500 ${popular ? "bg-fg text-bg shadow-[0_40px_80px_-40px_rgba(40,20,5,0.7)]" : "bg-surface/70 ring-1 ring-line/10"}`}
            >
              {popular && <span className="absolute -top-3 start-7 rounded-full bg-terracotta px-3 py-1 text-xs font-medium text-white">{p.popular}</span>}
              <h3 className="font-serif text-2xl italic">{p.names[plan.id]}</h3>
              <p className={`mt-1 min-h-10 text-sm ${popular ? "text-bg/70" : "text-muted-foreground"}`}>{p.blurbs[plan.id]}</p>
              <p className="mt-6 flex items-baseline gap-1.5">
                <span className="text-4xl font-semibold tabular-nums">{plan.monthly === 0 ? formatSar(0, locale) : formatSar(price, locale)}</span>
                {plan.monthly > 0 && <span className={`text-sm ${popular ? "text-bg/70" : "text-muted-foreground"}`}>{p.perMonth}</span>}
              </p>
              <p className={`mt-1 h-5 text-xs ${popular ? "text-bg/60" : "text-muted-foreground"}`}>{cycle === "yearly" && plan.yearly > 0 ? p.billedYearly(formatSar(plan.yearly, locale)) : ""}</p>
              <button
                type="button"
                disabled={mine}
                onClick={() => (plan.id === "free" ? (setSubscription("free", "monthly"), onChosen?.()) : setBuying(plan.id))}
                className={`mt-6 min-h-12 rounded-full text-[15px] font-medium transition-opacity disabled:cursor-default ${popular ? "bg-bg text-fg hover:opacity-90 disabled:opacity-80" : "bg-fg text-bg hover:opacity-90 disabled:bg-transparent disabled:text-fg disabled:ring-1 disabled:ring-line/30"}`}
              >
                {mine ? p.current : plan.id === "free" ? p.stayFree : p.choose(p.names[plan.id])}
              </button>
              <ul className="mt-7 grid gap-3 text-sm">
                {p.features[plan.id].map((f) => (
                  <li key={f} className="flex gap-2.5">
                    <Check />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>

      <AnimatePresence>
        {buying && (
          <PlanCheckout
            plan={buying}
            cycle={cycle}
            onClose={() => setBuying(null)}
            onDone={() => {
              setBuying(null);
              onChosen?.();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/** Card payment for a plan, in test mode: the card is checked, nothing is charged, the plan switches on. */
function PlanCheckout({ plan, cycle, onClose, onDone }: { plan: PlanId; cycle: Cycle; onClose: () => void; onDone: () => void }) {
  const p = useP();
  const c = p.checkout;
  const { locale } = useT();
  const info = planOf(plan);
  const amount = formatSar(cycle === "monthly" ? info.monthly : info.yearly, locale);
  const [number, setNumber] = useState("");
  const [name, setName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [focused, setFocused] = useState<CardField>(null);
  const [err, setErr] = useState<string | null>(null);
  const [state, setState] = useState<"form" | "paying" | "done">("form");
  const brand = detectBrand(number);
  const first = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    first.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && state !== "paying" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, state]);

  const pay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!luhnValid(number)) return setErr(c.errNumber);
    if (!name.trim()) return setErr(c.errName);
    if (!expiryValid(expiry)) return setErr(c.errExpiry);
    if (!cvcValid(cvc, brand)) return setErr(c.errCvc);
    setErr(null);
    setState("paying");
    setTimeout(() => {
      setSubscription(plan, cycle);
      setState("done");
    }, 1400);
  };

  const field = "mt-1.5 block min-h-12 w-full rounded-xl bg-bg px-4 text-[15px] ring-1 ring-line/15 focus:outline-none focus:ring-2 focus:ring-fg/50";

  return createPortal(
    <motion.div role="dialog" aria-modal="true" aria-label={c.title(p.names[plan])} className="fixed inset-0 z-[500] flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <button type="button" aria-label={p.later} tabIndex={-1} onClick={() => state !== "paying" && onClose()} className="absolute inset-0 bg-[rgb(30_20_12/0.5)] backdrop-blur-sm" />
      <motion.div initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="relative max-h-full w-full max-w-md overflow-y-auto rounded-3xl bg-bg p-7 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.5)]">
        {state === "done" ? (
          <div className="py-6 text-center">
            <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 18 }} className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sage text-white">
              <svg aria-hidden="true" viewBox="0 0 16 16" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 8.5l3 3 7-7" />
              </svg>
            </motion.div>
            <h2 className="mt-5 font-serif text-3xl italic">{c.done(p.names[plan])}</h2>
            <p className="mt-2 text-muted-foreground">{c.doneText(info.designs)}</p>
            <Link href="/creator" onClick={onDone} className="mt-7 inline-flex min-h-12 items-center rounded-full bg-fg px-7 font-medium text-bg hover:opacity-90">
              {c.start}
            </Link>
          </div>
        ) : (
          <form onSubmit={pay} noValidate>
            <h2 className="font-serif text-2xl italic">{c.title(p.names[plan])}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {amount} {cycle === "monthly" ? p.perMonth : p.perYear} · {p.designs(info.designs)}
            </p>
            <div className="mt-5 scale-[0.86] sm:scale-100" dir="ltr">
              <PaymentCard number={formatCardNumber(number)} name={name} expiry={expiry} cvc={cvc} brand={brand} focused={focused} />
            </div>
            <p className="mt-4 rounded-xl bg-surface px-4 py-2.5 text-xs text-muted-foreground">{c.test}</p>
            <label className="mt-4 block text-sm">
              {c.number}
              <input ref={first} inputMode="numeric" autoComplete="cc-number" dir="ltr" value={formatCardNumber(number)} onChange={(e) => setNumber(e.target.value)} onFocus={() => setFocused("number")} onBlur={() => setFocused(null)} className={field} />
            </label>
            <label className="mt-3 block text-sm">
              {c.name}
              <input autoComplete="cc-name" value={name} onChange={(e) => setName(e.target.value)} onFocus={() => setFocused("name")} onBlur={() => setFocused(null)} className={field} />
            </label>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="block text-sm">
                {c.expiry}
                <input inputMode="numeric" autoComplete="cc-exp" dir="ltr" value={expiry} onChange={(e) => setExpiry(formatExpiry(e.target.value))} onFocus={() => setFocused("expiry")} onBlur={() => setFocused(null)} className={field} />
              </label>
              <label className="block text-sm">
                {c.cvc}
                <input inputMode="numeric" autoComplete="cc-csc" dir="ltr" value={cvc} maxLength={4} onChange={(e) => setCvc(e.target.value.replace(/\D/g, ""))} onFocus={() => setFocused("cvc")} onBlur={() => setFocused(null)} className={field} />
              </label>
            </div>
            {err && (
              <p role="alert" className="mt-3 text-sm text-ember">
                {err}
              </p>
            )}
            <button type="submit" disabled={state === "paying"} className="mt-6 min-h-12 w-full rounded-full bg-fg text-[15px] font-medium text-bg hover:opacity-90 disabled:opacity-60">
              {state === "paying" ? c.paying : c.pay(amount)}
            </button>
            <button type="button" onClick={onClose} className="mt-2 min-h-10 w-full text-sm text-muted-foreground hover:text-fg">
              {p.later}
            </button>
          </form>
        )}
      </motion.div>
    </motion.div>,
    document.body,
  );
}

/** Shown in the creator when the month's designs are used up. */
export function UpgradeDialog({ onClose }: { onClose: () => void }) {
  const p = useP();
  const sub = useSubscription();
  const info = planOf(sub.plan);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !document.querySelector("[role=dialog][aria-modal=true] form") && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return createPortal(
    <motion.div role="dialog" aria-modal="true" aria-label={p.outTitle} className="fixed inset-0 z-[450] flex items-end justify-center sm:items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <button type="button" aria-label={p.later} tabIndex={-1} onClick={onClose} className="absolute inset-0 bg-[rgb(30_20_12/0.5)] backdrop-blur-sm" />
      <motion.div initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="relative max-h-[92svh] w-full max-w-5xl overflow-y-auto rounded-t-3xl bg-bg p-6 sm:rounded-3xl sm:p-10">
        <h2 className="text-center font-serif text-3xl italic sm:text-4xl">{p.outTitle}</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">{p.outText(p.names[sub.plan], info.designs)}</p>
        <div className="mt-8">
          <PricingPlans compact onChosen={onClose} />
        </div>
        <div className="mt-6 text-center">
          <button type="button" onClick={onClose} className="min-h-10 px-4 text-sm text-muted-foreground hover:text-fg">
            {p.later}
          </button>
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  );
}
