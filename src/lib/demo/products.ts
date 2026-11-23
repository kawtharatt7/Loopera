// Seeded demo pieces. Used by the landing page now and as seed data for the database later.
// Photos: free Unsplash License photos and one CC0 photo (WordPress Photo Directory).
// Colors here are product data (the maker's yarn colors), not UI design tokens.

export type ProductCategory = "wearable" | "bag" | "toy" | "home" | "flowers";

export interface DemoProduct {
  slug: string;
  title: string;
  maker: string;
  category: ProductCategory;
  priceSar: number;
  image: { src: string; alt: string; credit: string };
  colors: { name: string; hex: string }[];
}

const unsplash = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1400&q=75`;

export const DEMO_PRODUCTS: DemoProduct[] = [
  {
    slug: "cocoa-v-neck-top",
    title: "Cocoa V-neck top",
    maker: "Noor Loops",
    category: "wearable",
    priceSar: 340,
    image: { src: unsplash("photo-1551834449-5327927e63a1"), alt: "A woman wearing a brown crochet V-neck top with long sleeves", credit: "Vinícius Santos / Unsplash" },
    colors: [
      { name: "Cocoa", hex: "#7A4E36" },
      { name: "Oat", hex: "#D9C3A5" },
    ],
  },
  {
    slug: "market-bags",
    title: "Chain-strap mini bags",
    maker: "Dana Makes",
    category: "bag",
    priceSar: 190,
    image: { src: "https://pd.w.org/2025/09/72168db96fb57f960.50940423.jpg", alt: "Colorful hand-crocheted handbags hanging on a wooden rack, some with gold chain straps", credit: "Alina Kakshapati / WordPress Photo Directory (CC0)" },
    colors: [
      { name: "Sky", hex: "#9EC1D9" },
      { name: "Rose", hex: "#F3B6B6" },
      { name: "Butter", hex: "#F1D67A" },
      { name: "Red", hex: "#C8323A" },
    ],
  },
  {
    slug: "penguin-family",
    title: "Penguin family",
    maker: "Hala Hooks",
    category: "toy",
    priceSar: 220,
    image: { src: unsplash("photo-1779433755935-991480f06b98"), alt: "Five colorful crocheted penguin toys stacked on a table", credit: "Joachim Schnürle / Unsplash" },
    colors: [{ name: "Mixed", hex: "#4F7CAC" }],
  },
  {
    slug: "teal-summer-top",
    title: "Teal summer top",
    maker: "Noor Loops",
    category: "wearable",
    priceSar: 260,
    image: { src: unsplash("photo-1475179377649-672d1c1c75ec"), alt: "A woman wearing a teal crochet top with a white skirt", credit: "Unsplash" },
    colors: [
      { name: "Teal", hex: "#2F8F8A" },
      { name: "Cream", hex: "#F6EBDD" },
    ],
  },
  {
    slug: "sari-doll",
    title: "Sari, the yellow doll",
    maker: "Hala Hooks",
    category: "toy",
    priceSar: 150,
    image: { src: unsplash("photo-1559996279-1e9d0d508b74"), alt: "An orange and white crocheted doll", credit: "Unsplash" },
    colors: [{ name: "Marigold", hex: "#E9A23B" }],
  },
  {
    slug: "forever-bouquet",
    title: "Forever bouquet",
    maker: "Dana Makes",
    category: "flowers",
    priceSar: 120,
    image: { src: unsplash("photo-1700170447159-9d2d0da133a5"), alt: "A group of crocheted flowers on a carpet", credit: "Unsplash" },
    colors: [{ name: "Mixed", hex: "#E29B6A" }],
  },
  {
    slug: "sunset-granny-blanket",
    title: "Sunset granny blanket",
    maker: "Noor Loops",
    category: "home",
    priceSar: 590,
    image: { src: unsplash("photo-1782576417426-4ae01da20440"), alt: "Crochet granny squares in yellow, orange and pink", credit: "Cary Bates / Unsplash" },
    colors: [{ name: "Sunset", hex: "#F0A13A" }],
  },
];

export const CATEGORY_LABEL: Record<ProductCategory, string> = {
  wearable: "Clothes",
  bag: "Bags",
  toy: "Toys",
  home: "Home",
  flowers: "Flowers",
};

export function formatSar(amount: number): string {
  return new Intl.NumberFormat("en-SA", { style: "currency", currency: "SAR", maximumFractionDigits: 0 }).format(amount);
}
