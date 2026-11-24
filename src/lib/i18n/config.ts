export const LOCALES = ["ar", "en"] as const;
export type Locale = (typeof LOCALES)[number];

/** The site opens in Arabic; visitors can switch to English from the header. */
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "loopera-lang";

export function isLocale(v: unknown): v is Locale {
  return v === "ar" || v === "en";
}

export function dirOf(locale: Locale): "rtl" | "ltr" {
  return locale === "ar" ? "rtl" : "ltr";
}

/** Text with both languages, used for catalog data (product names, descriptions). */
export interface Bi {
  en: string;
  ar: string;
}

export function pick(text: Bi, locale: Locale): string {
  return text[locale];
}
