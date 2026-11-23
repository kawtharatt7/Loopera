import type { Bi } from "@/lib/i18n/config";
import type { TapestryId } from "@/lib/tapestry/designs";

// Demo catalog used until makers list their own pieces (database phase).
// Photos: Unsplash License and Pexels License (both free for commercial use, no attribution
// required; credits are kept anyway). Wall hangings are drawn from their own stitch charts.

export type Category = "clothes" | "bags" | "wall" | "toys" | "flowers" | "home";

export const CATEGORIES: { id: Category; label: Bi; blurb: Bi }[] = [
  { id: "clothes", label: { en: "Clothes", ar: "ملابس" }, blurb: { en: "Tops, ponchos and jackets, worn by real people.", ar: "بلايز وبونشو وجاكيتات، على ناس حقيقيين." } },
  { id: "bags", label: { en: "Bags", ar: "شنط" }, blurb: { en: "Market bags, shoulder bags and backpacks.", ar: "شنط سوق وشنط كتف وشنط ظهر." } },
  { id: "wall", label: { en: "Wall hangings", ar: "لوحات كروشيه" }, blurb: { en: "Tapestry crochet for your walls. Walk the gallery.", ar: "لوحات تابستري لجدرانك. امشي في المعرض." } },
  { id: "toys", label: { en: "Toys", ar: "دمى وألعاب" }, blurb: { en: "Amigurumi friends, stuffed firmly.", ar: "دمى أميغورومي محشوة بإتقان." } },
  { id: "flowers", label: { en: "Flowers", ar: "ورد" }, blurb: { en: "Bouquets that never wilt.", ar: "باقات ما تذبل أبداً." } },
  { id: "home", label: { en: "Home", ar: "للبيت" }, blurb: { en: "Blankets and throws for slow evenings.", ar: "بطانيات وأغطية للأمسيات الهادية." } },
];

export interface Photo {
  src: string;
  alt: Bi;
  credit: string;
  /** "model" = worn by a person; "hanger" = hanging garment; "product" = the piece on its own. */
  kind: "model" | "hanger" | "product";
}

export interface ColorOption {
  id: string;
  name: Bi;
  hex: string;
  /** Pieces left per size id. Missing sizes use the size's own stock. */
  stock?: Record<string, number>;
}

export interface SizeOption {
  id: string;
  label: Bi;
  price: number;
  stock: number;
}

export interface Product {
  slug: string;
  category: Category;
  title: Bi;
  maker: Bi;
  description: Bi;
  details: Bi[];
  madeToOrder: boolean;
  leadTimeDays: number;
  rating: number;
  reviews: number;
  sizes: SizeOption[];
  colors: ColorOption[];
  photos: Photo[];
  /** Wall hangings are drawn from their stitch chart instead of a photo. */
  tapestry?: TapestryId;
}

const u = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1600&q=75`;
const px = (id: number) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1600`;

const MAKERS = {
  noor: { en: "Noor Loops", ar: "نور لوبس" },
  hala: { en: "Hala Hooks", ar: "هلا هوكس" },
  dana: { en: "Dana Makes", ar: "دانة تصنع" },
  reem: { en: "Reem Studio", ar: "استوديو ريم" },
} satisfies Record<string, Bi>;

const WEAR = (base: number): SizeOption[] => [
  { id: "S", label: { en: "S", ar: "S" }, price: base, stock: 3 },
  { id: "M", label: { en: "M", ar: "M" }, price: base, stock: 2 },
  { id: "L", label: { en: "L", ar: "L" }, price: base + 30, stock: 1 },
];
const ONE = (price: number, stock: number): SizeOption[] => [{ id: "one", label: { en: "One size", ar: "مقاس واحد" }, price, stock }];
const WALL = (base: number): SizeOption[] => [
  { id: "40x55", label: { en: "40 × 55 cm", ar: "٤٠ × ٥٥ سم" }, price: base, stock: 2 },
  { id: "60x80", label: { en: "60 × 80 cm", ar: "٦٠ × ٨٠ سم" }, price: Math.round(base * 1.6), stock: 1 },
  { id: "80x110", label: { en: "80 × 110 cm", ar: "٨٠ × ١١٠ سم" }, price: Math.round(base * 2.4), stock: 1 },
];

const C = {
  cocoa: { id: "cocoa", name: { en: "Cocoa", ar: "كاكاو" }, hex: "#7A4E36" },
  oat: { id: "oat", name: { en: "Oat", ar: "شوفان" }, hex: "#D9C3A5" },
  wine: { id: "wine", name: { en: "Wine", ar: "نبيذي" }, hex: "#8E1523" },
  teal: { id: "teal", name: { en: "Teal", ar: "تركوازي" }, hex: "#2F8F8A" },
  peach: { id: "peach", name: { en: "Peach", ar: "خوخي" }, hex: "#E29B6A" },
  cream: { id: "cream", name: { en: "Cream", ar: "كريمي" }, hex: "#F3E6D4" },
  rose: { id: "rose", name: { en: "Rose", ar: "وردي" }, hex: "#F3B6B6" },
  sand: { id: "sand", name: { en: "Sand", ar: "رملي" }, hex: "#CDB08A" },
  rainbow: { id: "rainbow", name: { en: "Rainbow", ar: "ألوان الطيف" }, hex: "#D9634A" },
  caramel: { id: "caramel", name: { en: "Caramel", ar: "كراميل" }, hex: "#A8683A" },
  sky: { id: "sky", name: { en: "Sky", ar: "سماوي" }, hex: "#9EC1D9" },
  sunset: { id: "sunset", name: { en: "Sunset", ar: "غروب" }, hex: "#F0A13A" },
  mixed: { id: "mixed", name: { en: "Mixed", ar: "ألوان مشكّلة" }, hex: "#C9785C" },
  sun: { id: "sun", name: { en: "Sunflower", ar: "دوّار الشمس" }, hex: "#F2C230" },
  cherry: { id: "cherry", name: { en: "Cherry", ar: "كرزي" }, hex: "#B8232F" },
  olive: { id: "olive", name: { en: "Olive", ar: "زيتي" }, hex: "#7C8A4A" },
} satisfies Record<string, ColorOption>;

export const PRODUCTS: Product[] = [
  // Clothes
  {
    slug: "cocoa-v-neck-top",
    category: "clothes",
    title: { en: "Cocoa V-neck top", ar: "بلوزة كاكاو برقبة V" },
    maker: MAKERS.noor,
    description: { en: "Long sleeves in an open shell stitch, soft enough to wear straight on the skin.", ar: "أكمام طويلة بغرزة الصدفة المفتوحة، ناعمة على الجلد مباشرة." },
    details: [
      { en: "100% cotton yarn", ar: "خيط قطن ١٠٠٪" },
      { en: "Hand wash cold, dry flat", ar: "غسيل يدوي بارد، تجفيف مسطح" },
    ],
    madeToOrder: true,
    leadTimeDays: 10,
    rating: 4.8,
    reviews: 31,
    sizes: WEAR(340),
    colors: [C.cocoa, C.oat, { ...C.wine, stock: { L: 0 } }],
    photos: [{ src: u("photo-1551834449-5327927e63a1"), alt: { en: "A woman wearing a brown crochet V-neck top", ar: "امرأة تلبس بلوزة كروشيه بنية برقبة V" }, credit: "Vinícius Santos / Unsplash", kind: "model" }],
  },
  {
    slug: "teal-summer-top",
    category: "clothes",
    title: { en: "Teal summer top", ar: "بلوزة صيفية تركوازية" },
    maker: MAKERS.noor,
    description: { en: "A light mercerized cotton top for warm evenings.", ar: "بلوزة خفيفة من القطن الممرسر للأمسيات الدافية." },
    details: [
      { en: "Mercerized cotton", ar: "قطن ممرسر" },
      { en: "Lined front panel", ar: "واجهة مبطّنة" },
    ],
    madeToOrder: true,
    leadTimeDays: 7,
    rating: 4.6,
    reviews: 18,
    sizes: WEAR(260),
    colors: [C.teal, C.peach, C.cream],
    photos: [{ src: u("photo-1475179377649-672d1c1c75ec"), alt: { en: "A woman wearing a teal crochet top and white skirt", ar: "امرأة تلبس بلوزة كروشيه تركوازية وتنورة بيضاء" }, credit: "Tamara Bellis / Unsplash", kind: "model" }],
  },
  {
    slug: "cherry-stripe-top",
    category: "clothes",
    title: { en: "Cherry stripe top", ar: "بلوزة بخطوط كرزية" },
    maker: MAKERS.reem,
    description: { en: "Red and cream stripes in a close single-crochet fabric.", ar: "خطوط حمراء وكريمية بقماش غرزة مفردة متقاربة." },
    details: [
      { en: "Cotton blend", ar: "خليط قطن" },
      { en: "Fitted cut", ar: "قصة محددة" },
    ],
    madeToOrder: true,
    leadTimeDays: 9,
    rating: 4.7,
    reviews: 14,
    sizes: WEAR(290),
    colors: [C.cherry, C.wine, C.olive],
    photos: [{ src: u("photo-1767249632208-15bbbb674e16"), alt: { en: "A woman with long braids wearing a red and white top", ar: "امرأة بضفائر طويلة تلبس بلوزة حمراء وبيضاء" }, credit: "Unsplash", kind: "model" }],
  },
  {
    slug: "fringe-poncho",
    category: "clothes",
    title: { en: "Fringe poncho", ar: "بونشو بالشراشيب" },
    maker: MAKERS.dana,
    description: { en: "An easy poncho with a long fringe, made to throw over anything.", ar: "بونشو سهل بشراشيب طويلة، يجي فوق أي لبس." },
    details: [
      { en: "Soft acrylic and wool", ar: "أكريليك وصوف ناعم" },
      { en: "One piece, no seams", ar: "قطعة وحدة بدون خياطات" },
    ],
    madeToOrder: true,
    leadTimeDays: 12,
    rating: 4.9,
    reviews: 22,
    sizes: ONE(380, 3),
    colors: [C.sand, C.cream, C.cocoa],
    photos: [{ src: u("photo-1434389677669-e08b4cac3105"), alt: { en: "A beige crochet poncho with fringe on a wooden hanger", ar: "بونشو كروشيه بيج بشراشيب على علّاقة خشب" }, credit: "Unsplash", kind: "hanger" }],
  },
  {
    slug: "patchwork-jacket",
    category: "clothes",
    title: { en: "Patchwork jacket", ar: "جاكيت باتشورك" },
    maker: MAKERS.dana,
    description: { en: "A boxy jacket pieced from squares. Ask for your own colors.", ar: "جاكيت واسع من مربعات مجمّعة. اطلبي ألوانك الخاصة." },
    details: [
      { en: "Wool blend", ar: "خليط صوف" },
      { en: "Made to order, about 3 weeks", ar: "حسب الطلب، حوالي ٣ أسابيع" },
    ],
    madeToOrder: true,
    leadTimeDays: 21,
    rating: 4.9,
    reviews: 11,
    sizes: WEAR(560),
    colors: [C.mixed, C.peach, C.olive],
    photos: [{ src: u("photo-1679847628912-4c3e7402abc7"), alt: { en: "A crocheted jacket hanging on a wall next to a plant", ar: "جاكيت كروشيه معلّق على الجدار جنب نبتة" }, credit: "Unsplash", kind: "hanger" }],
  },

  // Bags
  {
    slug: "rainbow-market-bag",
    category: "bags",
    title: { en: "Rainbow market bag", ar: "شنطة سوق بألوان الطيف" },
    maker: MAKERS.dana,
    description: { en: "A bright handbag with leather handles and a lined inside.", ar: "شنطة يد ملونة بمقابض جلد وبطانة من الداخل." },
    details: [
      { en: "Cotton cord, leather handles", ar: "حبل قطن ومقابض جلد" },
      { en: "Lined, inner pocket", ar: "مبطّنة مع جيب داخلي" },
    ],
    madeToOrder: false,
    leadTimeDays: 3,
    rating: 4.8,
    reviews: 47,
    sizes: ONE(260, 5),
    colors: [C.rainbow],
    photos: [
      { src: px(33853684), alt: { en: "A multicolored crochet handbag hanging on a bar", ar: "شنطة كروشيه ملونة معلّقة على عمود" }, credit: "Pexels", kind: "product" },
      { src: px(33853676), alt: { en: "A woman in sunglasses holding the rainbow crochet bag", ar: "امرأة بنظارة شمسية تمسك شنطة الكروشيه الملونة" }, credit: "Pexels", kind: "model" },
      { src: px(33853683), alt: { en: "The rainbow bag from the side", ar: "الشنطة الملونة من الجنب" }, credit: "Pexels", kind: "product" },
      { src: px(33853682), alt: { en: "The rainbow bag in sunlight", ar: "الشنطة الملونة في الشمس" }, credit: "Pexels", kind: "product" },
    ],
  },
  {
    slug: "sunset-shoulder-bag",
    category: "bags",
    title: { en: "Sunset shoulder bag", ar: "شنطة كتف الغروب" },
    maker: MAKERS.reem,
    description: { en: "Warm stripes on a long strap, made for walks at golden hour.", ar: "خطوط دافية على حزام طويل، للمشي وقت الغروب." },
    details: [
      { en: "Cotton yarn", ar: "خيط قطن" },
      { en: "Zip closure", ar: "سحّاب" },
    ],
    madeToOrder: true,
    leadTimeDays: 6,
    rating: 4.9,
    reviews: 19,
    sizes: ONE(230, 4),
    colors: [C.sunset],
    photos: [{ src: px(38560428), alt: { en: "A woman in a headscarf carrying a colorful crochet bag at sunset", ar: "امرأة بحجاب تحمل شنطة كروشيه ملونة وقت الغروب" }, credit: "Pexels", kind: "model" }],
  },
  {
    slug: "leather-trim-backpack",
    category: "bags",
    title: { en: "Leather-trim backpack", ar: "شنطة ظهر بأطراف جلد" },
    maker: MAKERS.hala,
    description: { en: "A sturdy hand-crocheted backpack with leather straps and flap.", ar: "شنطة ظهر كروشيه متينة بأحزمة وغطاء جلد." },
    details: [
      { en: "Jute and cotton blend", ar: "خليط جوت وقطن" },
      { en: "Adjustable straps", ar: "أحزمة قابلة للتعديل" },
    ],
    madeToOrder: true,
    leadTimeDays: 14,
    rating: 4.7,
    reviews: 26,
    sizes: ONE(420, 2),
    colors: [C.caramel],
    photos: [
      { src: px(10820406), alt: { en: "A hand-crocheted backpack with leather accents", ar: "شنطة ظهر كروشيه بلمسات جلد" }, credit: "Pexels", kind: "product" },
      { src: px(10820408), alt: { en: "Close-up of the backpack's stitches and leather", ar: "قرب على غرز الشنطة والجلد" }, credit: "Pexels", kind: "product" },
      { src: px(10820410), alt: { en: "The backpack with travel things", ar: "الشنطة مع أغراض سفر" }, credit: "Pexels", kind: "product" },
    ],
  },
  {
    slug: "daisy-picnic-bag",
    category: "bags",
    title: { en: "Daisy picnic bag", ar: "شنطة نزهة بالأقحوان" },
    maker: MAKERS.noor,
    description: { en: "A cream bag with embroidered flowers. Fits a book and a thermos.", ar: "شنطة كريمية بورود مطرّزة، تكفي كتاب وترمس." },
    details: [
      { en: "Cotton, hand embroidered", ar: "قطن مطرّز باليد" },
      { en: "Short handles", ar: "مقابض قصيرة" },
    ],
    madeToOrder: false,
    leadTimeDays: 3,
    rating: 4.6,
    reviews: 33,
    sizes: ONE(210, 6),
    colors: [C.cream],
    photos: [
      { src: px(30224898), alt: { en: "A crochet bag with floral embroidery on a picnic blanket", ar: "شنطة كروشيه بتطريز ورد على بطانية نزهة" }, credit: "Pexels", kind: "product" },
      { src: px(30224895), alt: { en: "The daisy bag on a blue checkered blanket", ar: "شنطة الأقحوان على بطانية مربعات زرقاء" }, credit: "Pexels", kind: "product" },
    ],
  },
  {
    slug: "meadow-tote",
    category: "bags",
    title: { en: "Meadow tote", ar: "شنطة توت المرج" },
    maker: MAKERS.reem,
    description: { en: "A soft beige tote with a scatter of stitched flowers.", ar: "شنطة توت بيج ناعمة عليها ورد مطرّز." },
    details: [
      { en: "Cotton", ar: "قطن" },
      { en: "Long handles", ar: "مقابض طويلة" },
    ],
    madeToOrder: true,
    leadTimeDays: 5,
    rating: 4.5,
    reviews: 12,
    sizes: ONE(190, 4),
    colors: [C.sand],
    photos: [{ src: px(25469611), alt: { en: "A beige crochet bag with floral embroidery on grass", ar: "شنطة كروشيه بيج بتطريز ورد على العشب" }, credit: "Pexels", kind: "product" }],
  },

  // Wall hangings (drawn from stitch charts)
  ...([
    ["dunes-at-noon", { en: "Dunes at noon", ar: "كثبان الظهيرة" }, MAKERS.reem, 320],
    ["al-sadu", { en: "Al Sadu", ar: "السدو" }, MAKERS.hala, 360],
    ["palm-and-moon", { en: "Palm and moon", ar: "نخلة وقمر" }, MAKERS.noor, 300],
    ["arched-window", { en: "Arched window", ar: "نافذة مقوّسة" }, MAKERS.reem, 340],
    ["mountain-dawn", { en: "Mountain dawn", ar: "فجر الجبل" }, MAKERS.dana, 300],
    ["tulip", { en: "Tulip", ar: "توليب" }, MAKERS.noor, 280],
    ["sea-waves", { en: "Sea waves", ar: "موج البحر" }, MAKERS.hala, 290],
    ["crescent-night", { en: "Crescent night", ar: "ليلة الهلال" }, MAKERS.dana, 310],
    ["blush-check", { en: "Blush check", ar: "مربعات وردية" }, MAKERS.reem, 260],
  ] as const).map(
    ([slug, title, maker, price]): Product => ({
      slug,
      category: "wall",
      title,
      maker,
      description: {
        en: "Tapestry crochet in single crochet, finished with a wooden dowel and a cotton fringe.",
        ar: "تابستري كروشيه بالغرزة المفردة، بعصا خشب وشراشيب قطن.",
      },
      details: [
        { en: "Cotton yarn on a beech dowel", ar: "خيط قطن على عصا زان" },
        { en: "Ready to hang", ar: "جاهزة للتعليق" },
        { en: "Spot clean only", ar: "تنظيف موضعي فقط" },
      ],
      madeToOrder: true,
      leadTimeDays: 10,
      rating: 4.8,
      reviews: 9,
      sizes: WALL(price),
      colors: [{ id: "as-shown", name: { en: "As shown", ar: "كما في الصورة" }, hex: "#CE4F2F" }],
      photos: [],
      tapestry: slug,
    }),
  ),

  // Toys
  {
    slug: "penguin-family",
    category: "toys",
    title: { en: "Penguin family", ar: "عائلة البطاريق" },
    maker: MAKERS.hala,
    description: { en: "Five little penguins that stack, about 8 cm each.", ar: "خمس بطاريق صغيرة تتراكب، كل وحدة حوالي ٨ سم." },
    details: [
      { en: "Safety eyes", ar: "عيون آمنة" },
      { en: "Not for children under 3", ar: "غير مناسبة لأقل من ٣ سنوات" },
    ],
    madeToOrder: false,
    leadTimeDays: 4,
    rating: 5,
    reviews: 22,
    sizes: ONE(220, 3),
    colors: [{ ...C.mixed, name: { en: "Rainbow", ar: "ملوّن" } }],
    photos: [{ src: u("photo-1779433755935-991480f06b98"), alt: { en: "Five colorful crocheted penguin toys stacked on a table", ar: "خمس بطاريق كروشيه ملونة متراكبة على طاولة" }, credit: "Joachim Schnürle / Unsplash", kind: "product" }],
  },
  {
    slug: "sari-doll",
    category: "toys",
    title: { en: "Sari, the yellow doll", ar: "ساري، الدمية الصفراء" },
    maker: MAKERS.hala,
    description: { en: "A soft doll about 25 cm tall with a removable dress.", ar: "دمية ناعمة طولها حوالي ٢٥ سم بفستان ينخلع." },
    details: [
      { en: "Cotton yarn", ar: "خيط قطن" },
      { en: "Not for children under 3", ar: "غير مناسبة لأقل من ٣ سنوات" },
    ],
    madeToOrder: true,
    leadTimeDays: 7,
    rating: 4.5,
    reviews: 9,
    sizes: ONE(150, 4),
    colors: [{ ...C.sunset, name: { en: "Marigold", ar: "قطيفة" } }, C.rose],
    photos: [{ src: u("photo-1559996279-1e9d0d508b74"), alt: { en: "An orange and white crocheted doll", ar: "دمية كروشيه برتقالي وأبيض" }, credit: "Unsplash", kind: "product" }],
  },
  {
    slug: "elephant-clip",
    category: "toys",
    title: { en: "Little elephant clip", ar: "مشبك الفيل الصغير" },
    maker: MAKERS.noor,
    description: { en: "A tiny elephant on a clip with name beads. Tell us the name.", ar: "فيل صغير على مشبك بخرز الاسم. اكتبي لنا الاسم." },
    details: [
      { en: "Wooden beads", ar: "خرز خشب" },
      { en: "Personalised", ar: "يُخصّص بالاسم" },
    ],
    madeToOrder: true,
    leadTimeDays: 5,
    rating: 4.9,
    reviews: 40,
    sizes: ONE(95, 10),
    colors: [C.sky, C.rose],
    photos: [{ src: u("photo-1784368611050-ebe6372b7af9"), alt: { en: "A crocheted elephant clip with name beads", ar: "مشبك فيل كروشيه بخرز الاسم" }, credit: "Brenda Ortega / Unsplash", kind: "product" }],
  },

  // Flowers
  {
    slug: "forever-bouquet",
    category: "flowers",
    title: { en: "Forever bouquet", ar: "باقة للأبد" },
    maker: MAKERS.dana,
    description: { en: "Seven crocheted flowers on wrapped stems.", ar: "سبع وردات كروشيه على سيقان ملفوفة." },
    details: [{ en: "Wrapped in kraft paper", ar: "مغلّفة بورق كرافت" }],
    madeToOrder: false,
    leadTimeDays: 3,
    rating: 4.9,
    reviews: 40,
    sizes: ONE(120, 8),
    colors: [C.mixed, C.rose, C.wine],
    photos: [{ src: u("photo-1700170447159-9d2d0da133a5"), alt: { en: "Crocheted flowers on a carpet", ar: "ورد كروشيه على سجادة" }, credit: "Anya Chernykh / Unsplash", kind: "product" }],
  },
  {
    slug: "sunflower-stem",
    category: "flowers",
    title: { en: "Sunflower stem", ar: "زهرة دوّار الشمس" },
    maker: MAKERS.reem,
    description: { en: "One bright sunflower on a bendable stem.", ar: "زهرة دوّار شمس وحدة على ساق ينثني." },
    details: [{ en: "Wire stem", ar: "ساق سلك" }],
    madeToOrder: false,
    leadTimeDays: 2,
    rating: 4.8,
    reviews: 28,
    sizes: ONE(45, 20),
    colors: [C.sun],
    photos: [{ src: u("photo-1753366556705-1f657d2fa4db"), alt: { en: "A hand holding a crocheted sunflower", ar: "يد تمسك زهرة دوّار شمس كروشيه" }, credit: "Hasnain Ayaz / Unsplash", kind: "product" }],
  },
  {
    slug: "sunflower-pot",
    category: "flowers",
    title: { en: "Sunflower pot", ar: "أصيص دوّار الشمس" },
    maker: MAKERS.reem,
    description: { en: "A little potted sunflower for a desk or shelf.", ar: "أصيص صغير لدوّار الشمس للمكتب أو الرف." },
    details: [{ en: "Weighted base", ar: "قاعدة ثقيلة" }],
    madeToOrder: false,
    leadTimeDays: 3,
    rating: 4.7,
    reviews: 16,
    sizes: ONE(75, 9),
    colors: [C.sun],
    photos: [{ src: u("photo-1753366556702-d28165fc88bc"), alt: { en: "A hand holding a crochet sunflower pot", ar: "يد تمسك أصيص دوّار شمس كروشيه" }, credit: "Hasnain Ayaz / Unsplash", kind: "product" }],
  },
  {
    slug: "flower-bowl",
    category: "flowers",
    title: { en: "Flower bowl", ar: "صحن ورد" },
    maker: MAKERS.dana,
    description: { en: "A bowl of loose crochet blooms for a table centre.", ar: "صحن مليان ورد كروشيه لوسط الطاولة." },
    details: [{ en: "Twelve blooms", ar: "اثنا عشر وردة" }],
    madeToOrder: false,
    leadTimeDays: 4,
    rating: 4.6,
    reviews: 8,
    sizes: ONE(160, 3),
    colors: [C.mixed],
    photos: [{ src: u("photo-1700171458554-46cfd3f2a87a"), alt: { en: "A bowl of crocheted flowers on a gray carpet", ar: "صحن ورد كروشيه على سجادة رمادية" }, credit: "Anya Chernykh / Unsplash", kind: "product" }],
  },

  // Home
  {
    slug: "sunset-granny-blanket",
    category: "home",
    title: { en: "Sunset granny blanket", ar: "بطانية جراني الغروب" },
    maker: MAKERS.dana,
    description: { en: "A throw pieced from granny squares in warm sunset shades.", ar: "بطانية من مربعات الجراني بألوان الغروب الدافية." },
    details: [
      { en: "About 120 × 150 cm", ar: "حوالي ١٢٠ × ١٥٠ سم" },
      { en: "Made to order, about 3 weeks", ar: "حسب الطلب، حوالي ٣ أسابيع" },
    ],
    madeToOrder: true,
    leadTimeDays: 21,
    rating: 4.9,
    reviews: 12,
    sizes: [
      { id: "throw", label: { en: "Throw", ar: "غطاء" }, price: 590, stock: 2 },
      { id: "queen", label: { en: "Queen", ar: "كوين" }, price: 890, stock: 1 },
    ],
    colors: [C.sunset, C.rose],
    photos: [{ src: u("photo-1782576417426-4ae01da20440"), alt: { en: "Granny squares in yellow, orange and pink", ar: "مربعات جراني بالأصفر والبرتقالي والوردي" }, credit: "Cary Bates / Unsplash", kind: "product" }],
  },
  {
    slug: "festival-throw",
    category: "home",
    title: { en: "Festival throw", ar: "غطاء المهرجان" },
    maker: MAKERS.hala,
    description: { en: "Dense, bright stitches in every colour of the basket.", ar: "غرز كثيفة وملوّنة بكل ألوان السلة." },
    details: [{ en: "Acrylic, machine washable", ar: "أكريليك، يغسل بالغسالة" }],
    madeToOrder: true,
    leadTimeDays: 18,
    rating: 4.7,
    reviews: 7,
    sizes: ONE(520, 2),
    colors: [C.mixed],
    photos: [{ src: u("photo-1782576417438-d8facd37fe2d"), alt: { en: "Colorful crocheted fabric with intricate stitches", ar: "قماش كروشيه ملوّن بغرز دقيقة" }, credit: "Cary Bates / Unsplash", kind: "product" }],
  },
];

export function getProduct(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}

export function byCategory(c: Category): Product[] {
  return PRODUCTS.filter((p) => p.category === c);
}

export function fromPrice(p: Product): number {
  return Math.min(...p.sizes.map((s) => s.price));
}

export function stockFor(p: Product, colorId: string, sizeId: string): number {
  const color = p.colors.find((c) => c.id === colorId);
  const size = p.sizes.find((s) => s.id === sizeId);
  if (!color || !size) return 0;
  return color.stock?.[sizeId] ?? size.stock;
}

export function formatSar(amount: number, locale: "ar" | "en" = "en"): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-SA", { style: "currency", currency: "SAR", maximumFractionDigits: 0 }).format(amount);
}
