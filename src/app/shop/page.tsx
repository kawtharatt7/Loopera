import type { Metadata } from "next";
import { StorePage } from "@/components/shop/store-page";
import { DICT } from "@/lib/i18n/dict";
import { getLocale } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: DICT[await getLocale()].shop.title };
}

export default function ShopPage() {
  return <StorePage />;
}
