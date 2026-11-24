"use client";

import { useP } from "@/lib/i18n/pricing";
import { PricingPlans } from "./pricing-plans";

export function PricingPage() {
  const p = useP();
  return (
    <main id="main" className="mx-auto max-w-6xl px-5 pb-24 pt-36 sm:px-8 sm:pt-32">
      <header className="mx-auto max-w-2xl text-center">
        <h1 className="font-serif text-4xl italic sm:text-6xl">{p.title}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{p.sub}</p>
      </header>
      <div className="mt-12">
        <PricingPlans />
      </div>
      <section aria-labelledby="faq" className="mx-auto mt-20 max-w-3xl">
        <h2 id="faq" className="font-serif text-3xl italic">
          {p.faqTitle}
        </h2>
        <dl className="mt-6 divide-y divide-line/10 border-y border-line/10">
          {p.faq.map(([q, a]) => (
            <div key={q} className="py-5">
              <dt className="font-medium">{q}</dt>
              <dd className="mt-1.5 text-muted-foreground">{a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}
