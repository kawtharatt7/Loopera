"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatSar, getProduct } from "@/lib/shop/catalog";
import { useT } from "@/lib/i18n/client";
import { cartTotal, placeTestOrder, priceOf, useCart } from "@/lib/shop/cart";
import { BRAND_LABEL, cvcValid, detectBrand, digitsOnly, expiryValid, formatCardNumber, formatExpiry, luhnValid } from "@/lib/shop/card";
import { PaymentCard, type CardField } from "./payment-card";

type Errors = Partial<Record<"number" | "name" | "expiry" | "cvc" | "city", string>>;

function Field({
  label,
  error,
  children,
  id,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  id: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm text-muted-foreground">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-err`} className="mt-1 text-sm text-brand">
          {error}
        </p>
      )}
    </div>
  );
}

const input = "mt-1 min-h-12 w-full rounded-xl border border-line/20 bg-bg px-4 text-fg outline-none transition-colors focus:border-peach";

export function CheckoutForm() {
  const lines = useCart();
  const router = useRouter();
  const uid = useId();
  const [number, setNumber] = useState("");
  const [name, setName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [city, setCity] = useState("");
  const [focused, setFocused] = useState<CardField>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [paying, setPaying] = useState(false);
  const brand = detectBrand(number);
  const { t, bi, locale } = useT();
  const total = cartTotal(lines);

  if (lines.length === 0 && !paying) {
    return (
      <div className="py-20 text-center">
        <p className="text-2xl">{t.checkout.emptyCart}</p>
        <Link href="/shop" className="mt-4 inline-block underline underline-offset-4">
          {t.checkout.findSomething}
        </Link>
      </div>
    );
  }

  const validate = (): Errors => {
    const e: Errors = {};
    if (!luhnValid(number)) e.number = t.checkout.errNumber;
    if (name.trim().length < 2) e.name = t.checkout.errName;
    if (!expiryValid(expiry)) e.expiry = t.checkout.errExpiry;
    if (!cvcValid(cvc, brand)) e.cvc = t.checkout.errCvc;
    if (city.trim().length < 2) e.city = t.checkout.errCity;
    return e;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) {
      document.getElementById(`${uid}-${Object.keys(e)[0]}`)?.focus();
      return;
    }
    setPaying(true);
    // Test mode: nothing is charged. Only the last four digits and the network are kept.
    await new Promise((r) => setTimeout(r, 1100));
    const order = placeTestOrder({ name, city, cardLast4: digitsOnly(number).slice(-4), cardBrand: BRAND_LABEL[brand] });
    if (order) router.push(`/orders/${order.id}?new=1`);
    else setPaying(false);
  };

  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_0.9fr]">
      <form onSubmit={submit} noValidate className="order-2 space-y-5 lg:order-1">
        <PaymentCard number={formatCardNumber(number)} name={name} expiry={expiry} cvc={cvc} brand={brand} focused={focused} />

        <p className="rounded-xl bg-surface px-4 py-3 text-sm">
          {t.checkout.testMode}
        </p>

        <Field label={t.checkout.number} id={`${uid}-number`} error={errors.number}>
          <input
            id={`${uid}-number`}
            className={input}
            inputMode="numeric"
            autoComplete="cc-number"
            placeholder="1234 5678 9012 3456"
            value={formatCardNumber(number)}
            onChange={(e) => setNumber(digitsOnly(e.target.value).slice(0, 19))}
            onFocus={() => setFocused("number")}
            onBlur={() => setFocused(null)}
            aria-invalid={!!errors.number}
            aria-describedby={errors.number ? `${uid}-number-err` : undefined}
          />
        </Field>
        <Field label={t.checkout.name} id={`${uid}-name`} error={errors.name}>
          <input
            id={`${uid}-name`}
            className={input}
            autoComplete="cc-name"
            value={name}
            maxLength={40}
            onChange={(e) => setName(e.target.value)}
            onFocus={() => setFocused("name")}
            onBlur={() => setFocused(null)}
            aria-invalid={!!errors.name}
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t.checkout.expiry} id={`${uid}-expiry`} error={errors.expiry}>
            <input
              id={`${uid}-expiry`}
              className={input}
              inputMode="numeric"
              autoComplete="cc-exp"
              placeholder="MM/YY"
              value={expiry}
              onChange={(e) => setExpiry(formatExpiry(e.target.value))}
              onFocus={() => setFocused("expiry")}
              onBlur={() => setFocused(null)}
              aria-invalid={!!errors.expiry}
            />
          </Field>
          <Field label={t.checkout.cvc} id={`${uid}-cvc`} error={errors.cvc}>
            <input
              id={`${uid}-cvc`}
              className={input}
              inputMode="numeric"
              autoComplete="cc-csc"
              placeholder={brand === "amex" ? "4 digits" : "3 digits"}
              value={cvc}
              onChange={(e) => setCvc(digitsOnly(e.target.value).slice(0, brand === "amex" ? 4 : 3))}
              onFocus={() => setFocused("cvc")}
              onBlur={() => setFocused(null)}
              aria-invalid={!!errors.cvc}
            />
          </Field>
        </div>
        <Field label={t.checkout.city} id={`${uid}-city`} error={errors.city}>
          <input id={`${uid}-city`} className={input} autoComplete="address-level2" value={city} maxLength={60} onChange={(e) => setCity(e.target.value)} />
        </Field>

        <Button type="submit" size="lg" className="w-full" disabled={paying}>
          {paying ? t.checkout.paying : t.checkout.pay(formatSar(total, locale))}
        </Button>
      </form>

      <aside className="order-1 lg:order-2">
        <h2 className="text-2xl">{t.checkout.yourOrder}</h2>
        <ul className="mt-5 divide-y divide-line/10">
          {lines.map((l) => {
            const p = getProduct(l.slug);
            return (
              <li key={`${l.slug}-${l.color}-${l.size}`} className="flex justify-between gap-4 py-3">
                <span>
                  {p ? bi(p.title) : l.slug}
                  <span className="block text-sm text-muted-foreground">
                    {[p && bi(p.colors.find((c) => c.id === l.color)?.name ?? { en: l.color, ar: l.color }), p && bi(p.sizes.find((z) => z.id === l.size)?.label ?? { en: l.size, ar: l.size }), `× ${l.qty}`].filter(Boolean).join(locale === "ar" ? "، " : ", ")}
                  </span>
                </span>
                <span className="tabular-nums">{formatSar(priceOf(l) * l.qty, locale)}</span>
              </li>
            );
          })}
        </ul>
        <div className="mt-2 flex justify-between border-t border-line/20 pt-4 text-lg">
          <span>{t.checkout.total}</span>
          <span className="tabular-nums">{formatSar(total, locale)}</span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{t.checkout.freeShipping}</p>
      </aside>
    </div>
  );
}
