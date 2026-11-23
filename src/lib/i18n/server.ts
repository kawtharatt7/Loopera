import { cookies } from "next/headers";
import { DEFAULT_LOCALE, isLocale, type Locale } from "./config";

/** Current locale on the server, from the language cookie. */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const v = store.get("loopera-lang")?.value;
  return isLocale(v) ? v : DEFAULT_LOCALE;
}
