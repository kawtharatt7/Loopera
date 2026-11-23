"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n/client";
import type { Product } from "@/lib/shop/catalog";
import { TAPESTRIES, type TapestryId } from "@/lib/tapestry/designs";
import { hangingDataUrl } from "@/lib/tapestry/render";

const cache = new Map<string, string>();

/** A wall hanging drawn from its stitch chart, as an image (cached per design and size). */
export function useTapestryImage(id: TapestryId | undefined, cell = 14): string | null {
  const [url, setUrl] = useState<string | null>(id ? cache.get(`${id}:${cell}`) ?? null : null);
  useEffect(() => {
    if (!id) return;
    const key = `${id}:${cell}`;
    const hit = cache.get(key);
    if (hit) {
      setUrl(hit);
      return;
    }
    const d = TAPESTRIES[id];
    const made = hangingDataUrl(d.grid, d.palette.map((p) => p.hex), { cell, fringe: true, dowel: true });
    cache.set(key, made);
    setUrl(made);
  }, [id, cell]);
  return url;
}

/** The main picture of a piece: its photo, or its tapestry drawn from the chart. Fills its parent. */
export function PieceImage({
  product,
  photoIndex = 0,
  sizes,
  priority = false,
  className = "",
  fit = "cover",
}: {
  product: Product;
  photoIndex?: number;
  sizes: string;
  priority?: boolean;
  className?: string;
  fit?: "cover" | "contain";
}) {
  const { bi } = useT();
  const tapestry = useTapestryImage(product.tapestry, 14);
  if (product.tapestry) {
    return tapestry ? (
      // eslint-disable-next-line @next/next/no-img-element -- generated data URL, nothing to optimize
      <img src={tapestry} alt={bi(product.title)} className={`absolute inset-0 h-full w-full object-contain p-[6%] ${className}`} />
    ) : (
      <div className="absolute inset-0 animate-pulse bg-surface-2/50" />
    );
  }
  const photo = product.photos[photoIndex] ?? product.photos[0];
  if (!photo) return <div className="absolute inset-0 bg-surface-2" />;
  return (
    <Image
      src={photo.src}
      alt={bi(photo.alt)}
      fill
      sizes={sizes}
      priority={priority}
      className={`${fit === "cover" ? "object-cover" : "object-contain"} ${className}`}
    />
  );
}
