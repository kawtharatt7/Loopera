import type { Metadata } from "next";
import { StoreRoom } from "@/components/shop/store-room";
import { DICT } from "@/lib/i18n/dict";
import { getLocale } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: DICT[await getLocale()].shop.title };
}

export default function ShopPage() {
  return <StoreRoom />;
}
