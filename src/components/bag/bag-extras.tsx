"use client";

import { useEffect, useState } from "react";
import { WhatsAppIcon } from "@/components/custom/custom-order";
import { useC } from "@/lib/i18n/collection";
import { useT } from "@/lib/i18n/client";
import { formatSar, getProduct } from "@/lib/shop/catalog";
import { cartTotal, priceOf, useCart } from "@/lib/shop/cart";
import { GIFT_WRAP_PRICE, readGift, whatsappLink, writeGift, type Gift } from "@/lib/shop/whatsapp";

/** On the bag page: send as a gift (+SAR 15 wrap and a card note) and finish the order on WhatsApp. */
export function BagExtras() {
  const lines = useCart();
  const { bi, locale } = useT();
  const c = useC();
  const [gift, setGiftState] = useState<Gift>({ on: false, note: "" });
  useEffect(() => setGiftState(readGift()), []);
  const setGift = (g: Gift) => {
    setGiftState(g);
    writeGift(g);
  };
  const total = cartTotal(lines) + (gift.on && lines.length ? GIFT_WRAP_PRICE : 0);
  const waText = () => {
    const rows = lines
      .map((l) => {
        const p = getProduct(l.slug);
        if (!p) return "";
        const color = p.colors.find((x) => x.id === l.color);
        const size = p.sizes.find((x) => x.id === l.size);
        return `• ${l.qty} × ${bi(p.title)} (${[color && bi(color.name), size && bi(size.label)].filter(Boolean).join(", ")}) ${formatSar(priceOf(l) * l.qty, locale)}`;
      })
      .filter(Boolean)
      .join("\n");
    const g = gift.on ? `${c.gift.line} +${formatSar(GIFT_WRAP_PRICE, locale)}${gift.note.trim() ? `: "${gift.note.trim()}"` : ""}\n` : "";
    return c.waOrder(rows, formatSar(total, locale), g);
  };
  if (!lines.length) return null;
  return (
    <div className="mt-6 flex flex-col gap-3 border-t border-line/10 pt-5">
      <label className="flex cursor-pointer items-start gap-3">
        <input type="checkbox" checked={gift.on} onChange={(e) => setGift({ ...gift, on: e.target.checked })} className="mt-1 h-4 w-4 accent-[rgb(var(--primary))]" />
        <span>
          <span className="block font-medium">{c.gift.label}</span>
          <span className="block text-sm text-muted-foreground">{c.gift.wrap(`+${formatSar(GIFT_WRAP_PRICE, locale)}`)}</span>
        </span>
      </label>
      {gift.on && (
        <textarea value={gift.note} onChange={(e) => setGift({ ...gift, note: e.target.value.slice(0, 240) })} placeholder={c.gift.note} aria-label={c.gift.note} className="min-h-20 w-full rounded-lg border border-line/20 bg-bg p-2 text-sm" />
      )}
      {gift.on && (
        <div className="flex justify-between text-lg">
          <span>{c.gift.totalWithWrap}</span>
          <span className="tabular-nums">{formatSar(total, locale)}</span>
        </div>
      )}
      <a href={whatsappLink(waText())} target="_blank" rel="noopener noreferrer" className="flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-[#1F7A4D]/50 font-medium text-[#1F7A4D] transition-colors hover:bg-[#1F7A4D] hover:text-white dark:text-[#5FC08E]">
        <WhatsAppIcon />
        {c.whatsapp}
      </a>
    </div>
  );
}
