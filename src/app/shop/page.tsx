import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = { title: "Shop" };

export default function ShopPage() {
  return (
    <ComingSoon
      tone="shop"
      phase="Shop"
      title="The Shop is still on the hook"
      blurb="Handmade pieces from makers will live here, ready to buy or to customize. It arrives in a later phase."
    />
  );
}
