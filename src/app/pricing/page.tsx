import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/site-header";
import { PricingPage } from "@/components/pricing/pricing-page";

export const metadata: Metadata = { title: "Pricing" };

export default function Page() {
  return (
    <>
      <SiteHeader />
      <PricingPage />
    </>
  );
}
