"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, type ReactNode } from "react";
import { LOCALE_COOKIE, type Bi, type Locale } from "./config";
import { DICT, type Dict } from "./dict";

const LocaleContext = createContext<Locale>("en");

export function LocaleProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

/** Dictionary for the current language, plus a helper for bilingual catalog text. */
export function useT(): { t: Dict; locale: Locale; bi: (b: Bi) => string } {
  const locale = useLocale();
  return { t: DICT[locale], locale, bi: (b: Bi) => b[locale] };
}

/** Switches language: saves the choice for a year and re-renders the page in place. */
export function useSetLocale(): (next: Locale) => void {
  const router = useRouter();
  return useCallback(
    (next: Locale) => {
      document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
      document.documentElement.lang = next;
      document.documentElement.dir = next === "ar" ? "rtl" : "ltr";
      router.refresh();
    },
    [router],
  );
}
