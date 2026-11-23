// Seeded demo products. Used by the landing page now and as seed data for the database in Phase 4/6.
// Colors here are product data (the maker's yarn colors), not UI design tokens.

export type GarmentKind = "knit" | "tee" | "hoodie" | "shirt" | "jacket" | "coat";
export type ProductCategory = "wearable" | "amigurumi" | "bag" | "blanket" | "accessory";

export interface DemoProduct {
  slug: string;
  title: string;
  maker: string;
  category: ProductCategory;
  kind: GarmentKind | null;
  priceSar: number;
  colors: { name: string; hex: string }[];
  blurb: string;
}

export const DEMO_PRODUCTS: DemoProduct[] = [
  {
    slug: "ember-cropped-cardigan",
    title: "Ember cropped cardigan",
    maker: "Noor Loops",
    category: "wearable",
    kind: "knit",
    priceSar: 420,
    colors: [
      { name: "Ember", hex: "#CE4F2F" },
      { name: "Wine", hex: "#8E1523" },
      { name: "Oat", hex: "#E8D5C0" },
    ],
    blurb: "Chunky granny-stitch cardigan with wooden buttons.",
  },
  {
    slug: "rose-chunky-sweater",
    title: "Rose chunky sweater",
    maker: "Hala Hooks",
    category: "wearable",
    kind: "knit",
    priceSar: 480,
    colors: [
      { name: "Rose", hex: "#F3B6B6" },
      { name: "Peach", hex: "#E29B6A" },
    ],
    blurb: "Soft oversized sweater in a puff-stitch texture.",
  },
  {
    slug: "peach-summer-top",
    title: "Peach summer top",
    maker: "Noor Loops",
    category: "wearable",
    kind: "tee",
    priceSar: 260,
    colors: [
      { name: "Peach", hex: "#E29B6A" },
      { name: "Cream", hex: "#FBEDE8" },
    ],
    blurb: "Light cotton mesh top for warm evenings.",
  },
  {
    slug: "wine-market-bag",
    title: "Wine market bag",
    maker: "Dana Makes",
    category: "bag",
    kind: null,
    priceSar: 190,
    colors: [
      { name: "Wine", hex: "#8E1523" },
      { name: "Ember", hex: "#CE4F2F" },
    ],
    blurb: "Sturdy mesh tote that folds into a pocket.",
  },
  {
    slug: "little-bear",
    title: "Little bear",
    maker: "Hala Hooks",
    category: "amigurumi",
    kind: null,
    priceSar: 150,
    colors: [
      { name: "Ember", hex: "#CE4F2F" },
      { name: "Peach", hex: "#E29B6A" },
    ],
    blurb: "A 15 cm bear, safety eyes, stuffed firmly.",
  },
  {
    slug: "harvest-jacket",
    title: "Harvest jacket",
    maker: "Dana Makes",
    category: "wearable",
    kind: "jacket",
    priceSar: 650,
    colors: [
      { name: "Wine", hex: "#8E1523" },
      { name: "Oat", hex: "#E8D5C0" },
    ],
    blurb: "Granny-square patchwork jacket, fully lined.",
  },
];

export function formatSar(amount: number): string {
  return new Intl.NumberFormat("en-SA", { style: "currency", currency: "SAR", maximumFractionDigits: 0 }).format(amount);
}
