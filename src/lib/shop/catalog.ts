import type { Bi } from "@/lib/i18n/config";
import type { TapestryId } from "@/lib/tapestry/designs";

// Demo catalog used until makers list their own pieces (database phase).
// Every picture is in /public/images, cropped from the lookbook and catalog photos Loopera supplied.
// Clothes and bags can be repainted in other yarns (CIELAB recolor inside the piece's mask).

export type Category = "clothes" | "bags" | "wall" | "dolls" | "flowers";

/** Wall hangings come in four families (the hub's filter tabs). */
export type WallGroup = "saudi-clubs" | "global-clubs" | "flags" | "anime" | "originals";

export const CATEGORIES: { id: Category; label: Bi; blurb: Bi }[] = [
  { id: "clothes", label: { en: "Clothes", ar: "ملابس" }, blurb: { en: "Sweaters, vests, tops and dresses, worn in the studio.", ar: "بلايز وصديريات وتوبات وفساتين، ملبوسة في الاستوديو." } },
  { id: "bags", label: { en: "Bags", ar: "شنط" }, blurb: { en: "Hand bags, totes and clutches in nine yarn colours.", ar: "شنط يد وتوت وكلتش بتسعة ألوان خيط." } },
  { id: "wall", label: { en: "Wall hangings", ar: "لوحات جدارية" }, blurb: { en: "Pixel tapestries: clubs, flags, cities and characters, or your own design.", ar: "لوحات بكسل: أندية وأعلام ومدن وشخصيات، أو تصميمك الخاص." } },
  { id: "dolls", label: { en: "Dolls", ar: "دمى" }, blurb: { en: "Amigurumi dolls, made to look like the person you have in mind.", ar: "دمى أميغورومي، تنشغل على شكل الشخص اللي ببالك." } },
  { id: "flowers", label: { en: "Bouquets", ar: "بوكيهات" }, blurb: { en: "Forever flowers that never wilt.", ar: "ورد ما يذبل أبداً." } },
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
  /** Photo of the piece in this color. Colors without one are not offered (except the first, shown in photos[0]). */
  photo?: string;
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
  /**
   * Shows the piece in another yarn color by repainting its photo in the browser: pixels close to
   * `from` (inside the piece's mask, so skin and background stay) take the new color, keeping the stitch shading.
   */
  recolor?: { from: string; mask?: string };
  /** The piece cut out of its photo (transparent background), for the product hero and the home page. */
  cutout?: string;
  /** Wall hangings are drawn from their stitch chart instead of a photo. */
  tapestry?: TapestryId;
  /** Wall hangings: which family the piece belongs to. */
  group?: WallGroup;
  /** Showcase archive only: shown in the gallery, not sold (no price, no cart). */
  showcase?: boolean;
  /** Clothes: the garment on its own, on a wooden hanger (cut out). */
  hanger?: string;
  /** Clothes: the model wearing it, cut out (no backdrop). */
  model?: string;
}

const LOOPERA: Bi = { en: "Loopera", ar: "لوبيرا" };
const SHOT = (src: string, alt: Bi): Photo[] => [{ src, alt, credit: "Loopera", kind: "model" }];
const PRODUCT_SHOT = (src: string, alt: Bi): Photo[] => [{ src, alt, credit: "Loopera", kind: "product" }];

const WEAR = (base: number): SizeOption[] => [
  { id: "S", label: { en: "S", ar: "S" }, price: base, stock: 5 },
  { id: "M", label: { en: "M", ar: "M" }, price: base, stock: 5 },
  { id: "L", label: { en: "L", ar: "L" }, price: base + 20, stock: 5 },
  { id: "XL", label: { en: "XL", ar: "XL" }, price: base + 40, stock: 5 },
];
const ONE = (price: number): SizeOption[] => [{ id: "one", label: { en: "One size", ar: "مقاس واحد" }, price, stock: 10 }];
/** Bags are crocheted to order in three sizes; the Midi is the one in the photo. */
const BAG = (base: number): SizeOption[] => [
  { id: "mini", label: { en: "Mini", ar: "ميني" }, price: Math.round((base * 0.75) / 5) * 5, stock: 10 },
  { id: "midi", label: { en: "Midi", ar: "ميدي" }, price: base, stock: 10 },
  { id: "maxi", label: { en: "Maxi", ar: "ماكسي" }, price: Math.round((base * 1.3) / 5) * 5, stock: 10 },
];
const WALL = (base: number): SizeOption[] => [
  { id: "30x20", label: { en: "30 × 20 cm", ar: "٣٠ × ٢٠ سم" }, price: base, stock: 10 },
  { id: "45x30", label: { en: "45 × 30 cm", ar: "٤٥ × ٣٠ سم" }, price: base + 40, stock: 10 },
];

/** The garment colours offered on every piece of clothing (the photo is the first). */
const CLOTHES_COLORS: ColorOption[] = [
  { id: "as-shown", name: { en: "As in the photo", ar: "مثل الصورة" }, hex: "transparent" },
  { id: "cream", name: { en: "Cream", ar: "كريمي" }, hex: "#EFE6D6" },
  { id: "terracotta", name: { en: "Terracotta", ar: "تيراكوتا" }, hex: "#C86D51" },
  { id: "sage", name: { en: "Sage olive", ar: "زيتوني فاتح" }, hex: "#768670" },
  { id: "espresso", name: { en: "Espresso", ar: "إسبريسو" }, hex: "#3B2A22" },
  { id: "oatmeal", name: { en: "Oatmeal", ar: "شوفاني" }, hex: "#D9C8AE" },
  { id: "burgundy", name: { en: "Burgundy", ar: "عنابي" }, hex: "#7A1E2C" },
];
/** The nine yarn colours every bag can be ordered in. The first is the photo itself. */
const BAG_COLORS: ColorOption[] = [
  { id: "as-shown", name: { en: "As in the photo", ar: "مثل الصورة" }, hex: "transparent" },
  { id: "cream", name: { en: "Raw cream", ar: "كريمي" }, hex: "#EFE6D6" },
  { id: "terracotta", name: { en: "Terracotta", ar: "تيراكوتا" }, hex: "#C86D51" },
  { id: "sage", name: { en: "Sage olive", ar: "زيتوني فاتح" }, hex: "#8FA07A" },
  { id: "espresso", name: { en: "Espresso", ar: "إسبريسو" }, hex: "#3B2A22" },
  { id: "burgundy", name: { en: "Burgundy", ar: "عنابي" }, hex: "#7A1E2C" },
  { id: "rose", name: { en: "Rose", ar: "وردي" }, hex: "#E9A3A8" },
  { id: "sky", name: { en: "Sky", ar: "سماوي" }, hex: "#8DB4D6" },
  { id: "navy", name: { en: "Navy", ar: "كحلي" }, hex: "#26324F" },
  { id: "butter", name: { en: "Butter", ar: "زبدي" }, hex: "#EBD48A" },
];
const AS_SHOWN: ColorOption[] = [{ id: "as-shown", name: { en: "As in the photo", ar: "مثل الصورة" }, hex: "#C9785C" }];

type Garment = [slug: string, en: string, ar: string, enDesc: string, arDesc: string, price: number, from: string];
const GARMENTS: Garment[] = [
  ["star-bell-sleeve-sweater", "Crop bell-sleeve sweater", "بلوزة قصيرة بأكمام جرس", "A cropped cream sweater with a star on the chest and striped bell sleeves.", "بلوزة كريمية قصيرة بنجمة على الصدر وأكمام جرس مقلّمة.", 320, "#EDE3D2"],
  ["green-rose-hem-dress", "Green rose-hem dress", "فستان أخضر بحافة ورود", "A short green pinafore dress with a row of crochet flowers at the hem.", "فستان قصير أخضر بصف ورود كروشيه على الحافة.", 380, "#6E8B4A"],
  ["open-weave-maxi-overlay", "Open-weave maxi overlay", "عباءة شبك طويلة", "A long open-mesh overlay with side slits, worn over trousers.", "قطعة شبك طويلة بفتحات جانبية، تنلبس فوق البنطلون.", 420, "#EDE8DE"],
  ["daisy-vest", "Daisy vest", "صديري الأقحوان", "Granny squares with cream daisies on espresso, tied at the front.", "مربعات جراني بأقحوان كريمي على بني غامق، بربطة من الأمام.", 340, "#3A2418"],
  ["flared-yellow-cardigan", "Flared yellow cardigan", "كارديغان أصفر بأكمام واسعة", "A soft butter-yellow mesh cardigan with flared sleeves and a tie.", "كارديغان شبك أصفر ناعم بأكمام واسعة وربطة.", 360, "#F2E3A6"],
  ["spiderweb-mesh-top", "Spiderweb mesh top", "توب شبك العنكبوت", "A burgundy mesh top with a spiderweb worked across the front.", "توب شبك عنابي بشبكة عنكبوت مشغولة على الأمام.", 260, "#7A1E1E"],
  ["distressed-striped-sweater", "Distressed striped sweater", "بلوزة مقلّمة ممزّعة", "Pink and black stripes with laddered, distressed stitches.", "خطوط وردي وأسود بغرز ممزّعة.", 340, "#E59BB4"],
  ["checkerboard-maxi-dress", "Checkerboard maxi dress", "فستان مربعات طويل", "A long red and cream checkerboard dress with a side slit.", "فستان طويل بمربعات أحمر وكريمي وفتحة جانبية.", 480, "#C2252C"],
  ["granny-square-cardigan", "Granny-square cardigan", "كارديغان مربعات جراني", "A patchwork cardigan of mustard, rust and teal granny squares.", "كارديغان من مربعات جراني بالخردلي والصدئي والتركوازي.", 460, "#C98A2E"],
  ["sage-mesh-polo", "Sage mesh polo", "بولو شبك زيتوني", "A short-sleeved open-mesh polo in sage.", "بولو شبك بأكمام قصيرة بلون زيتوني فاتح.", 300, "#8FA27C"],
  ["terracotta-halter-top", "Terracotta halter top", "توب هالتر تيراكوتا", "A lace halter top with a scalloped hem.", "توب هالتر دانتيل بحافة متموّجة.", 240, "#B4583A"],
  ["sand-mesh-tank", "Sand mesh tank", "توب شبك رملي", "A cropped open-mesh tank in sand.", "توب شبك قصير بلون رملي.", 240, "#D2B080"],
  ["cream-cable-sweater", "Cream cable sweater", "بلوزة كيبل كريمية", "A chunky cable-pattern sweater in raw cream.", "بلوزة سميكة بنقشة كيبل بلون كريمي.", 440, "#E8DCC6"],
  ["rust-knit-tank", "Rust knit tank", "توب صدئي بدون أكمام", "A close-fitting sleeveless top in rust.", "توب بدون أكمام بلون صدئي.", 250, "#B56839"],
  ["cocoa-pointelle-vest", "Cocoa pointelle vest", "صديري كاكاو مخرّم", "A V-neck vest with bands of open pointelle stitches.", "صديري برقبة V وأشرطة غرز مخرّمة.", 320, "#523728"],
  ["caramel-cable-vest", "Caramel cable vest", "صديري كيبل كراميل", "A sleeveless cable sweater vest in caramel.", "صديري كيبل بدون أكمام بلون كراميل.", 340, "#A8673A"],
  ["striped-maxi-dress", "Striped mesh maxi dress", "فستان شبك مقلّم طويل", "A long mesh dress in rust, mustard, cream and teal stripes.", "فستان شبك طويل بخطوط صدئي وخردلي وكريمي وتركوازي.", 460, "#C2673E"],
  ["cream-collar-vest", "Cream collar vest", "صديري بياقة كريمي", "A sleeveless mesh top with a polo collar, in cream.", "توب شبك بدون أكمام بياقة بولو، كريمي.", 280, "#E3D3B6"],
];

/** Garments that also have a photo on a wooden hanger. */
const HANGERS = ["star-bell-sleeve-sweater", "green-rose-hem-dress", "open-weave-maxi-overlay", "daisy-vest", "flared-yellow-cardigan", "spiderweb-mesh-top", "distressed-striped-sweater", "checkerboard-maxi-dress"];

/** Loopera's own original tapestries (no club, flag or character): sold normally. */
const ORIGINALS: [id: string, en: string, ar: string, price: number][] = [
  ["sabr", "Sabr calligraphy", "صبر بالخط العربي", 180],
  ["love", "Ai (love) character", "حرف الحب", 160],
  ["geese", "Geese", "الإوز", 190],
  ["duck", "Duck", "البطة", 140],
  ["cat", "Climbing cat", "القطة المتعلّقة", 160],
  ["orca", "Orca", "الأوركا", 170],
  ["pink-bird", "Pink bird", "الطير الوردي", 170],
  ["sleep", "I love sleep", "أحب النوم", 150],
  ["face", "Little face", "الوجه الصغير", 150],
  ["heart", "Heart", "القلب", 120],
  ["star", "Star", "النجمة", 120],
  ["yinyang", "Yin yang", "ين يانغ", 130],
];

type BagRow = [slug: string, en: string, ar: string, enDesc: string, arDesc: string, midi: number, from: string];
const BAGS: BagRow[] = [
  ["snug-shell-bag", "Embellished burgundy bag", "شنطة عنابية مزيّنة", "Chunky burgundy stitches studded with shells and pearls.", "غرز عنابية سميكة مزيّنة بأصداف ولؤلؤ.", 260, "#6E1424"],
  ["slate-flower-bag", "Slate tote with flower", "شنطة رمادية بوردة", "A slate-grey tote with a burgundy crochet flower charm.", "شنطة رمادية بتعليقة وردة كروشيه عنابية.", 220, "#6E7682"],
  ["wine-mini-bag", "Wine mini bag", "شنطة نبيذي صغيرة", "A small wine bag with a grey flower charm.", "شنطة نبيذي صغيرة بتعليقة وردة رمادية.", 200, "#6A1426"],
  ["olive-handheld-bag", "Hand-held olive bag", "شنطة يد زيتونية", "A soft ribbed bag in olive with a rounded handle.", "شنطة مضلّعة ناعمة بالزيتوني بيد مدوّرة.", 230, "#5E6A2C"],
  ["dusty-blue-daisy-bag", "Dusty blue floral bag", "شنطة زرقاء بزهرة", "Dusty blue with a beaded strand and a daisy charm.", "أزرق باهت بسلسلة خرز وتعليقة أقحوان.", 240, "#5E7894"],
  ["navy-bow-clutch", "Navy bow clutch", "كلتش كحلي بفيونكة", "A small navy bag with a cream ribbon bow.", "شنطة كحلية صغيرة بفيونكة كريمية.", 210, "#1B2130"],
  ["chocolate-tassel-bag", "Tasselled chocolate bag", "شنطة شوكولاتة بشراشيب", "A chocolate tote with long tassels at the sides.", "شنطة شوكولاتة بشراشيب طويلة على الجوانب.", 250, "#4A2A1C"],
  ["denim-star-bag", "Denim star bag", "شنطة جينز بنجمة", "Denim-blue stitches with a dark star charm.", "غرز زرقاء جينز بتعليقة نجمة غامقة.", 230, "#3E5F8A"],
  ["cream-braided-tote", "Cream braided tote", "شنطة توت مضفّرة كريمية", "A basket-weave tote with braided handles.", "شنطة توت بنسجة السلة ويد مضفّرة.", 250, "#E7DECF"],
  ["terracotta-crescent-bag", "Terracotta crescent bag", "شنطة هلال تيراكوتا", "A half-moon shoulder bag worked in rounds.", "شنطة كتف على شكل نص قمر مشغولة بدوائر.", 220, "#B5563D"],
  ["sage-daisy-crossbody", "Sage daisy crossbody", "شنطة كروس زيتونية بالأقحوان", "Six daisy granny squares on a long strap.", "ست مربعات جراني بالأقحوان على حزام طويل.", 240, "#9AAE8C"],
  ["cocoa-bucket-bag", "Cocoa bucket bag", "شنطة باكيت كاكاو", "A drawstring bucket bag with wooden beads.", "شنطة باكيت برباط وخرز خشب.", 250, "#4A3024"],
  ["cream-mesh-tote", "Cream mesh tote", "شنطة شبك كريمية", "An open-mesh market tote in cream.", "شنطة سوق شبك كريمية.", 210, "#DDCDB9"],
  ["burgundy-pearl-clutch", "Burgundy pearl clutch", "كلتش عنابي باللؤلؤ", "A pleated clutch on a pearl strap.", "كلتش مكسّر بحزام لؤلؤ.", 240, "#6E1626"],
];

const ALL: Product[] = [
  ...GARMENTS.map(([slug, en, ar, enDesc, arDesc, price, from]): Product => ({
    slug,
    category: "clothes",
    title: { en, ar },
    maker: LOOPERA,
    description: { en: enDesc, ar: arDesc },
    details: [{ en: "Hand crocheted in cotton yarn", ar: "كروشيه باليد بخيط قطن" }, { en: "Made to your size and colour", ar: "ينشغل على مقاسك ولونك" }],
    madeToOrder: true,
    leadTimeDays: 10,
    rating: 0,
    reviews: 0,
    sizes: WEAR(price),
    colors: CLOTHES_COLORS,
    photos: SHOT(`/images/clothes/${slug}.webp`, { en: `A model wearing the ${en.toLowerCase()}`, ar: `عارضة لابسة ${ar}` }),
    recolor: { from, mask: `/images/clothes/mask/${slug}.png` },
    hanger: HANGERS.includes(slug) ? `/images/clothes/hanger/${slug}.webp` : undefined,
    model: `/images/clothes/model/${slug}.webp`,
  })),
  ...BAGS.map(([slug, en, ar, enDesc, arDesc, midi, from]): Product => ({
    slug,
    category: "bags",
    title: { en, ar },
    maker: LOOPERA,
    description: { en: enDesc, ar: arDesc },
    details: [{ en: "Chunky cotton yarn, lined", ar: "خيط قطن سميك، ببطانة" }, { en: "Mini, Midi or Maxi", ar: "ميني أو ميدي أو ماكسي" }],
    madeToOrder: true,
    leadTimeDays: 10,
    rating: 0,
    reviews: 0,
    sizes: BAG(midi),
    colors: BAG_COLORS,
    photos: PRODUCT_SHOT(`/images/bags/${slug}.webp`, { en: en, ar }),
    cutout: `/images/bags/${slug}.webp`,
    recolor: { from },
  })),
  ...ORIGINALS.map(([id, en, ar, price]): Product => ({
    slug: `wall-${id}`,
    category: "wall",
    group: "originals",
    title: { en, ar },
    maker: LOOPERA,
    description: { en: "One of our own tapestry designs, crocheted to order.", ar: "من تصاميمنا الخاصة، تنشغل حسب الطلب." },
    details: [{ en: "Tapestry crochet, acrylic yarn", ar: "كروشيه تابستري، خيط أكريليك" }, { en: "Ready to hang", ar: "جاهزة للتعليق" }],
    madeToOrder: true,
    leadTimeDays: 7,
    rating: 0,
    reviews: 0,
    sizes: WALL(price),
    colors: AS_SHOWN,
    photos: PRODUCT_SHOT(`/images/wall/orig-${id}.webp`, { en: `${en}, a crocheted wall hanging`, ar: `${ar}، لوحة كروشيه` }),
  })),
  {
    slug: "graduate-doll-her",
    category: "dolls",
    title: { en: "Graduate doll (her)", ar: "دمية الخرّيجة" },
    maker: LOOPERA,
    description: { en: "A graduate in gown and cap, holding her diploma.", ar: "خرّيجة بالروب والقبعة، ماسكة شهادتها." },
    details: [{ en: "About 22 cm tall", ar: "طولها حوالي ٢٢ سم" }, { en: "Sash colour and name on request", ar: "لون الوشاح والاسم حسب الطلب" }],
    madeToOrder: true,
    leadTimeDays: 10,
    rating: 0,
    reviews: 0,
    sizes: ONE(220),
    colors: AS_SHOWN,
    photos: PRODUCT_SHOT("/images/dolls/graduate-doll-her.webp", { en: "Crochet graduate doll with long dark hair", ar: "دمية خرّيجة كروشيه بشعر طويل غامق" }),
    cutout: "/images/dolls/graduate-doll-her.webp",
  },
  {
    slug: "graduate-doll-him",
    category: "dolls",
    title: { en: "Graduate doll (him)", ar: "دمية الخرّيج" },
    maker: LOOPERA,
    description: { en: "A graduate in gown and cap with a rolled diploma.", ar: "خرّيج بالروب والقبعة مع شهادة ملفوفة." },
    details: [{ en: "About 22 cm tall", ar: "طوله حوالي ٢٢ سم" }, { en: "Sash colour and name on request", ar: "لون الوشاح والاسم حسب الطلب" }],
    madeToOrder: true,
    leadTimeDays: 10,
    rating: 0,
    reviews: 0,
    sizes: ONE(220),
    colors: AS_SHOWN,
    photos: PRODUCT_SHOT("/images/dolls/graduate-doll-him.webp", { en: "Crochet graduate doll with short brown hair", ar: "دمية خرّيج كروشيه بشعر بني قصير" }),
    cutout: "/images/dolls/graduate-doll-him.webp",
  },
  {
    slug: "sunflower-rose-bouquet",
    category: "flowers",
    title: { en: "Sunflowers and roses", ar: "دوّار الشمس والورد" },
    maker: LOOPERA,
    description: { en: "Two sunflowers and three red roses in blush paper with a satin bow.", ar: "وردتين دوّار شمس وثلاث وردات حمراء بورق وردي وفيونكة ساتان." },
    details: [{ en: "5 stems, about 35 cm", ar: "٥ وردات، حوالي ٣٥ سم" }],
    madeToOrder: true,
    leadTimeDays: 5,
    rating: 0,
    reviews: 0,
    sizes: ONE(180),
    colors: AS_SHOWN,
    photos: PRODUCT_SHOT("/images/bouquets/sunflower-rose-bouquet.webp", { en: "Crochet bouquet of sunflowers and red roses", ar: "بوكيه كروشيه دوّار شمس وورد أحمر" }),
    cutout: "/images/bouquets/sunflower-rose-bouquet.webp",
  },
  {
    slug: "lavender-daisy-bouquet",
    category: "flowers",
    title: { en: "Lavender and daisies", ar: "لافندر وأقحوان" },
    maker: LOOPERA,
    description: { en: "Lavender sprigs and white daisies in sheer paper, tied with twine.", ar: "أعواد لافندر وأقحوان أبيض بورق شفاف ومربوطة بخيط جوت." },
    details: [{ en: "8 stems, about 32 cm", ar: "٨ أعواد، حوالي ٣٢ سم" }],
    madeToOrder: true,
    leadTimeDays: 5,
    rating: 0,
    reviews: 0,
    sizes: ONE(140),
    colors: AS_SHOWN,
    photos: PRODUCT_SHOT("/images/bouquets/lavender-daisy-bouquet.webp", { en: "Crochet lavender and daisy bouquet", ar: "بوكيه كروشيه لافندر وأقحوان" }),
    cutout: "/images/bouquets/lavender-daisy-bouquet.webp",
  },
  {
    slug: "red-tulip-bouquet",
    category: "flowers",
    title: { en: "Red tulips", ar: "توليب أحمر" },
    maker: LOOPERA,
    description: { en: "Five red tulips in kraft paper, tied with twine.", ar: "خمس توليبات حمراء بورق كرافت ومربوطة بخيط جوت." },
    details: [{ en: "5 stems, about 30 cm", ar: "٥ وردات، حوالي ٣٠ سم" }],
    madeToOrder: true,
    leadTimeDays: 5,
    rating: 0,
    reviews: 0,
    sizes: ONE(95),
    colors: AS_SHOWN,
    photos: PRODUCT_SHOT("/images/bouquets/red-tulip-bouquet.webp", { en: "Crochet red tulip bouquet", ar: "بوكيه توليب أحمر كروشيه" }),
    cutout: "/images/bouquets/red-tulip-bouquet.webp",
  },
];

/** Pieces with a recolor recipe can be shown in any yarn color; others only in the colors photographed. */
export const PRODUCTS: Product[] = ALL.map((p) => ({ ...p, colors: p.recolor ? p.colors : p.colors.filter((c, i) => i === 0 || !!c.photo) }));

/** The photo to show for a color: its own photo, or the first photo for the first color. */
export function photoFor(p: Product, colorId: string): string {
  return p.colors.find((c) => c.id === colorId)?.photo ?? p.photos[0]?.src ?? "";
}

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
