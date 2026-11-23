// Card checks for the test checkout. Nothing here sends card data anywhere.

export type CardBrand = "visa" | "mastercard" | "mada" | "amex" | "unknown";

// A few mada BIN prefixes (Saudi debit network). Checked before Visa and Mastercard,
// since mada cards are co-branded with them.
const MADA_BINS = ["588845", "440647", "440795", "446404", "457865", "968208", "636120", "417633", "468540", "468541", "468542", "468543", "968201", "446393", "588847", "400861", "409201", "458456", "484783", "968205", "462220", "455708", "588848", "455036", "968203", "486094", "486095", "486096", "504300", "440533", "489317", "489318", "489319", "445564", "968211", "401757", "410685", "406996", "432328", "428671", "428672", "428673", "968206", "446672", "543357", "434107", "431361", "604906", "521076", "588850", "968202", "535825", "529415", "543085", "524130", "554180", "549760", "588849", "968209", "524514", "529741", "537767", "535989", "536023", "513213", "585265", "588983", "588982", "589005", "508160", "531095", "530906", "532013", "968204", "422817", "422818", "422819", "428331", "483010", "483011", "483012", "589206", "968207", "419593", "439954", "407197", "407395", "520058", "530060", "531196"];

export function digitsOnly(v: string): string {
  return v.replace(/\D/g, "");
}

export function detectBrand(number: string): CardBrand {
  const d = digitsOnly(number);
  if (d.length >= 6 && MADA_BINS.includes(d.slice(0, 6))) return "mada";
  if (/^4/.test(d)) return "visa";
  if (/^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/.test(d)) return "mastercard";
  if (/^3[47]/.test(d)) return "amex";
  return "unknown";
}

export const BRAND_LABEL: Record<CardBrand, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  mada: "mada",
  amex: "American Express",
  unknown: "Card",
};

/** Groups digits for display: 4-4-4-4, or 4-6-5 for Amex. */
export function formatCardNumber(v: string): string {
  const d = digitsOnly(v).slice(0, 19);
  if (detectBrand(d) === "amex") return [d.slice(0, 4), d.slice(4, 10), d.slice(10, 15)].filter(Boolean).join(" ");
  return d.replace(/(.{4})/g, "$1 ").trim();
}

export function luhnValid(v: string): boolean {
  const d = digitsOnly(v);
  if (d.length < 12 || d.length > 19) return false;
  let sum = 0;
  let double = false;
  for (let i = d.length - 1; i >= 0; i--) {
    let n = d.charCodeAt(i) - 48;
    if (double) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    double = !double;
  }
  return sum % 10 === 0;
}

export function formatExpiry(v: string): string {
  const d = digitsOnly(v).slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

/** MM/YY in the future (the card works until the end of that month). */
export function expiryValid(v: string, now = new Date()): boolean {
  const m = /^(\d{2})\/(\d{2})$/.exec(v);
  if (!m) return false;
  const month = Number(m[1]);
  const year = 2000 + Number(m[2]);
  if (month < 1 || month > 12) return false;
  const end = new Date(year, month, 1);
  return end > now && year < now.getFullYear() + 20;
}

export function cvcValid(v: string, brand: CardBrand): boolean {
  return brand === "amex" ? /^\d{4}$/.test(v) : /^\d{3}$/.test(v);
}
