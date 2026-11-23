"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { CATEGORY_LABEL, DEMO_PRODUCTS, formatSar, fromPrice, type ProductCategory } from "@/lib/demo/products";

type Sort = "featured" | "low" | "high";
const CATEGORIES = Object.keys(CATEGORY_LABEL) as ProductCategory[];
const MAX_PRICE = Math.max(...DEMO_PRODUCTS.map(fromPrice));

/** All pieces with category, price and color filters. Filtering happens instantly, in the browser. */
export function ShopGrid() {
  const [category, setCategory] = useState<ProductCategory | "all">("all");
  const [maxPrice, setMaxPrice] = useState(MAX_PRICE);
  const [color, setColor] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>("featured");

  const allColors = useMemo(() => {
    const m = new Map<string, string>();
    DEMO_PRODUCTS.forEach((p) => p.colors.forEach((c) => m.set(c.name, c.hex)));
    return [...m.entries()];
  }, []);

  const list = useMemo(() => {
    const out = DEMO_PRODUCTS.filter(
      (p) =>
        (category === "all" || p.category === category) &&
        fromPrice(p) <= maxPrice &&
        (color === null || p.colors.some((c) => c.name === color)),
    );
    if (sort === "low") out.sort((a, b) => fromPrice(a) - fromPrice(b));
    if (sort === "high") out.sort((a, b) => fromPrice(b) - fromPrice(a));
    return out;
  }, [category, maxPrice, color, sort]);

  const chip = (active: boolean) =>
    `min-h-10 cursor-pointer rounded-lg px-4 text-sm transition-colors ${active ? "bg-fg text-bg" : "bg-surface hover:bg-surface-2"}`;

  return (
    <div>
      <div className="flex flex-col gap-5 border-b border-line/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div role="group" aria-label="Category" className="flex flex-wrap gap-2">
          <button type="button" className={chip(category === "all")} aria-pressed={category === "all"} onClick={() => setCategory("all")}>
            Everything
          </button>
          {CATEGORIES.map((c) => (
            <button key={c} type="button" className={chip(category === c)} aria-pressed={category === c} onClick={() => setCategory(c)}>
              {CATEGORY_LABEL[c]}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-end gap-5">
          <label className="text-sm text-muted-foreground">
            Up to <span className="tabular-nums text-fg">{formatSar(maxPrice)}</span>
            <input
              type="range"
              min={100}
              max={MAX_PRICE}
              step={10}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="mt-1 block w-44 accent-[rgb(var(--primary))]"
            />
          </label>
          <label className="text-sm text-muted-foreground">
            Sort
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="mt-1 block min-h-10 rounded-lg bg-surface px-3 text-fg">
              <option value="featured">Featured</option>
              <option value="low">Price, low to high</option>
              <option value="high">Price, high to low</option>
            </select>
          </label>
        </div>
      </div>

      <div role="group" aria-label="Color" className="mt-5 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-sm text-muted-foreground">Color</span>
        {allColors.map(([name, hex]) => (
          <button
            key={name}
            type="button"
            aria-pressed={color === name}
            aria-label={name}
            title={name}
            onClick={() => setColor(color === name ? null : name)}
            className={`h-8 w-8 cursor-pointer rounded-full ring-offset-2 ring-offset-bg transition-transform hover:scale-110 ${color === name ? "ring-2 ring-fg" : "ring-1 ring-line/20"}`}
            style={{ backgroundColor: hex }}
          />
        ))}
        {color && (
          <button type="button" onClick={() => setColor(null)} className="ml-2 text-sm underline underline-offset-4">
            Clear color
          </button>
        )}
      </div>

      {list.length === 0 ? (
        <div className="py-24 text-center">
          <p className="text-xl">Nothing matches those filters.</p>
          <button
            type="button"
            className="mt-4 underline underline-offset-4"
            onClick={() => {
              setCategory("all");
              setMaxPrice(MAX_PRICE);
              setColor(null);
            }}
          >
            Show everything
          </button>
        </div>
      ) : (
        <ul className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3">
          {list.map((p, i) => (
            <li key={p.slug}>
              <Link href={`/shop/${p.slug}`} className="group block">
                <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-surface">
                  <Image src={p.image.src} alt={p.image.alt} fill priority={i < 3} sizes="(min-width: 768px) 33vw, 50vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
                </div>
                <div className="mt-3 flex items-baseline justify-between gap-3">
                  <p className="font-medium underline-offset-4 group-hover:underline">{p.title}</p>
                  <p className="shrink-0 tabular-nums">{formatSar(fromPrice(p))}</p>
                </div>
                <p className="text-sm text-muted-foreground">{p.maker}</p>
                <div className="mt-2 flex gap-1.5" aria-label={`Colors: ${p.colors.map((c) => c.name).join(", ")}`}>
                  {p.colors.map((c) => (
                    <span key={c.name} className="h-3.5 w-3.5 rounded-full ring-1 ring-line/20" style={{ backgroundColor: c.hex }} />
                  ))}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
