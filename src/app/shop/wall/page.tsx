import type { Metadata } from "next";
import { WallGallery } from "@/components/gallery/wall-gallery";
import { DICT } from "@/lib/i18n/dict";
import { getLocale } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: DICT[await getLocale()].gallery.headline };
}

export default function WallGalleryPage() {
  return <WallGallery />;
}
