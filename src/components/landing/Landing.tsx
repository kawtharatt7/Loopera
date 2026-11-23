import { YarnHero } from "@/components/hero/yarn-hero";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { HowItWorks } from "./how-it-works";
import { ShopPlace } from "./shop-place";
import { StudioPlace } from "./studio-place";

export function Landing() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <YarnHero />
        <div id="places">
          <StudioPlace />
          <ShopPlace />
        </div>
        <HowItWorks />
      </main>
      <SiteFooter />
    </>
  );
}
