// Seeded demo pieces. Used by the shop until makers list their own (database phase).
// Photos: free Unsplash License photos and one CC0 photo (WordPress Photo Directory).
// Colors here are product data (the maker's yarn colors), not UI design tokens.

export type ProductCategory = "wearable" | "bag" | "toy" | "home" | "flowers";
export type RailKind = "tee" | "knit" | "hoodie" | "shirt" | "jacket" | "coat";

export interface ProductColor {
  name: string;
  hex: string;
  /** Pieces left per size in this color. Missing sizes fall back to the size's own stock. */
  stock?: Record<string, number>;
}

export interface ProductSize {
  label: string;
  price: number;
  stock: number;
}

export interface DemoProduct {
  slug: string;
  title: string;
  maker: string;
  category: ProductCategory;
  /** Drawn garment used on the clothing rail until the maker uploads a cut-out photo. */
  railKind: RailKind | null;
  description: string;
  details: string[];
  leadTimeDays: number;
  madeToOrder: boolean;
  rating: number;
  reviews: number;
  sizes: ProductSize[];
  image: { src: string; alt: string; credit: string };
  /** Color the photo shows. Other colors are crocheted to order in the chosen yarn. */
  shownIn: string;
  colors: ProductColor[];
}

const unsplash = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1400&q=75`;
const WEAR_SIZES = (base: number): ProductSize[] => [
  { label: "S", price: base, stock: 3 },
  { label: "M", price: base, stock: 2 },
  { label: "L", price: base + 30, stock: 1 },
];
const ONE = (price: number, stock: number): ProductSize[] => [{ label: "One size", price, stock }];

export const DEMO_PRODUCTS: DemoProduct[] = [
  {
    slug: "cocoa-v-neck-top",
    title: "Cocoa V-neck top",
    maker: "Noor Loops",
    category: "wearable",
    railKind: "knit",
    description: "A long-sleeved top in an open shell stitch, soft enough to wear straight on the skin.",
    details: ["100% cotton yarn", "Hand wash cold, dry flat", "Made to order in your color"],
    leadTimeDays: 10,
    madeToOrder: true,
    rating: 4.8,
    reviews: 31,
    sizes: WEAR_SIZES(340),
    image: { src: unsplash("photo-1551834449-5327927e63a1"), alt: "A woman wearing a brown crochet V-neck top with long sleeves", credit: "Vinícius Santos / Unsplash" },
    shownIn: "Cocoa",
    colors: [
      { name: "Cocoa", hex: "#7A4E36" },
      { name: "Oat", hex: "#D9C3A5" },
      { name: "Wine", hex: "#8E1523", stock: { L: 0 } },
    ],
  },
  {
    slug: "teal-summer-top",
    title: "Teal summer top",
    maker: "Noor Loops",
    category: "wearable",
    railKind: "tee",
    description: "A cropped top in light mercerized cotton, made for warm evenings.",
    details: ["Mercerized cotton", "Lined front panel", "Hand wash cold"],
    leadTimeDays: 7,
    madeToOrder: true,
    rating: 4.6,
    reviews: 18,
    sizes: WEAR_SIZES(260),
    image: { src: unsplash("photo-1475179377649-672d1c1c75ec"), alt: "A woman wearing a teal crochet top with a white skirt", credit: "Unsplash" },
    shownIn: "Teal",
    colors: [
      { name: "Teal", hex: "#2F8F8A" },
      { name: "Peach", hex: "#E29B6A" },
      { name: "Cream", hex: "#F6EBDD" },
    ],
  },
  {
    slug: "sunset-granny-blanket",
    title: "Sunset granny blanket",
    maker: "Dana Makes",
    category: "home",
    railKind: null,
    description: "A throw pieced from granny squares in warm sunset shades. Ask for your own colors.",
    details: ["Acrylic and wool blend", "About 120 × 150 cm", "Made to order, about 3 weeks"],
    leadTimeDays: 21,
    madeToOrder: true,
    rating: 4.9,
    reviews: 12,
    sizes: [
      { label: "Throw", price: 590, stock: 2 },
      { label: "Queen", price: 890, stock: 1 },
    ],
    image: { src: unsplash("photo-1782576417426-4ae01da20440"), alt: "Crochet granny squares in yellow, orange and pink", credit: "Cary Bates / Unsplash" },
    shownIn: "Sunset",
    colors: [
      { name: "Sunset", hex: "#F0A13A" },
      { name: "Ember", hex: "#CE4F2F" },
      { name: "Rose", hex: "#F3B6B6" },
    ],
  },
  {
    slug: "chain-strap-bag",
    title: "Chain-strap mini bag",
    maker: "Dana Makes",
    category: "bag",
    railKind: null,
    description: "A small structured bag with a gold chain strap. Fits a phone, keys and a lipstick.",
    details: ["Cotton cord", "Lined, magnetic clasp", "Gold-tone chain"],
    leadTimeDays: 5,
    madeToOrder: false,
    rating: 4.7,
    reviews: 54,
    sizes: ONE(190, 6),
    image: { src: "https://pd.w.org/2025/09/72168db96fb57f960.50940423.jpg", alt: "Colorful hand-crocheted handbags hanging on a wooden rack, some with gold chain straps", credit: "Alina Kakshapati / WordPress Photo Directory (CC0)" },
    shownIn: "Sky",
    colors: [
      { name: "Sky", hex: "#9EC1D9" },
      { name: "Rose", hex: "#F3B6B6", stock: { "One size": 2 } },
      { name: "Butter", hex: "#F1D67A" },
      { name: "Red", hex: "#C8323A", stock: { "One size": 0 } },
    ],
  },
  {
    slug: "penguin-family",
    title: "Penguin family",
    maker: "Hala Hooks",
    category: "toy",
    railKind: null,
    description: "Five little penguins that stack. Safety eyes, stuffed firmly, about 8 cm each.",
    details: ["Cotton yarn, polyester stuffing", "Safety eyes", "Not for children under 3"],
    leadTimeDays: 4,
    madeToOrder: false,
    rating: 5,
    reviews: 22,
    sizes: ONE(220, 3),
    image: { src: unsplash("photo-1779433755935-991480f06b98"), alt: "Five colorful crocheted penguin toys stacked on a table", credit: "Joachim Schnürle / Unsplash" },
    shownIn: "Rainbow",
    colors: [
      { name: "Rainbow", hex: "#4F7CAC" },
      { name: "Pastel", hex: "#F3B6B6" },
    ],
  },
  {
    slug: "sari-doll",
    title: "Sari, the yellow doll",
    maker: "Hala Hooks",
    category: "toy",
    railKind: null,
    description: "A soft doll with a removable dress, about 25 cm tall.",
    details: ["Cotton yarn", "Removable dress", "Not for children under 3"],
    leadTimeDays: 7,
    madeToOrder: true,
    rating: 4.5,
    reviews: 9,
    sizes: ONE(150, 4),
    image: { src: unsplash("photo-1559996279-1e9d0d508b74"), alt: "An orange and white crocheted doll", credit: "Unsplash" },
    shownIn: "Marigold",
    colors: [
      { name: "Marigold", hex: "#E9A23B" },
      { name: "Rose", hex: "#F3B6B6" },
    ],
  },
  {
    slug: "forever-bouquet",
    title: "Forever bouquet",
    maker: "Dana Makes",
    category: "flowers",
    railKind: null,
    description: "Seven crocheted flowers on wrapped stems. They never wilt.",
    details: ["Cotton yarn on wire stems", "Wrapped in kraft paper", "Add a card at checkout"],
    leadTimeDays: 3,
    madeToOrder: false,
    rating: 4.9,
    reviews: 40,
    sizes: ONE(120, 8),
    image: { src: unsplash("photo-1700170447159-9d2d0da133a5"), alt: "A group of crocheted flowers on a carpet", credit: "Unsplash" },
    shownIn: "Mixed",
    colors: [
      { name: "Mixed", hex: "#E29B6A" },
      { name: "Blush", hex: "#F3B6B6" },
      { name: "Wine", hex: "#8E1523" },
    ],
  },
];

export const CATEGORY_LABEL: Record<ProductCategory, string> = {
  wearable: "Clothes",
  bag: "Bags",
  toy: "Toys",
  home: "Home",
  flowers: "Flowers",
};

export function getProduct(slug: string): DemoProduct | undefined {
  return DEMO_PRODUCTS.find((p) => p.slug === slug);
}

export function fromPrice(p: DemoProduct): number {
  return Math.min(...p.sizes.map((s) => s.price));
}

/** Pieces left of one color in one size. */
export function stockFor(p: DemoProduct, colorName: string, sizeLabel: string): number {
  const color = p.colors.find((c) => c.name === colorName);
  const size = p.sizes.find((s) => s.label === sizeLabel);
  if (!color || !size) return 0;
  return color.stock?.[sizeLabel] ?? size.stock;
}

export function formatSar(amount: number): string {
  return new Intl.NumberFormat("en-SA", { style: "currency", currency: "SAR", maximumFractionDigits: 0 }).format(amount);
}
