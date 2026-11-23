import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { WallGallery } from "@/components/gallery/wall-gallery";
import { DICT } from "@/lib/i18n/dict";
import { getLocale } from "@/lib/i18n/server";
import { byCategory } from "@/lib/shop/catalog";

export async function generateMetadata(): Promise<Metadata> {
  return { title: DICT[await getLocale()].gallery.headline };
}

export default function WallGalleryPage() {
  // The walk-through gallery opens once there are enough real wall-hanging pieces to hang.
  if (byCategory("wall").length < 3) redirect("/shop#wall");
  return <WallGallery />;
}
