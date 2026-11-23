"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";
import { BagProvider } from "@/components/bag/bag-context";
import { BagDrawer } from "@/components/bag/bag-drawer";
import type { Locale } from "@/lib/i18n/config";
import { LocaleProvider } from "@/lib/i18n/client";
import { YarnBackground } from "@/components/yarn-background";

// Language, the slide-in bag, and Framer Motion respecting "reduce motion".
export function Providers({ locale, children }: { locale: Locale; children: ReactNode }) {
  return (
    <LocaleProvider locale={locale}>
      <MotionConfig reducedMotion="user">
        <YarnBackground />
        <BagProvider>
          {children}
          <BagDrawer />
        </BagProvider>
      </MotionConfig>
    </LocaleProvider>
  );
}
