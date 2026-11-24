// Orders can be finished on WhatsApp with the maker: a pre-filled message, nothing sent automatically.

export const WHATSAPP_NUMBER = "966562322408";
export const GIFT_WRAP_PRICE = 15;

export function whatsappLink(text: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

const GIFT_KEY = "loopera-gift-v1";
export type Gift = { on: boolean; note: string };

export function readGift(): Gift {
  try {
    const g = JSON.parse(localStorage.getItem(GIFT_KEY) ?? "null");
    return g && typeof g.on === "boolean" && typeof g.note === "string" ? { on: g.on, note: g.note.slice(0, 240) } : { on: false, note: "" };
  } catch {
    return { on: false, note: "" };
  }
}

export function writeGift(g: Gift) {
  try {
    localStorage.setItem(GIFT_KEY, JSON.stringify(g));
  } catch {
    // Storage blocked: the choice still holds for this visit.
  }
}
