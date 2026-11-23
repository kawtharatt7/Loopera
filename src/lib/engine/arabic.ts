// Arabic wording for engine output. The engine writes US terms; this rewrites them in the
// Arabic crochet vocabulary (مفردة = single crochet, عمود = double crochet, زيادة / نقص).

const PHRASES: [RegExp, string][] = [
  [/Magic ring, ch 3 \(counts as dc\), 2 dc in ring, ch 2, \(3 dc in ring, ch 2\) x3, join to top of ch 3/g, "حلقة سحرية، ٣ سلاسل (تُحسب عمود)، ٢ عمود في الحلقة، ٢ سلسلة، (٣ عمود في الحلقة، ٢ سلسلة) ×٣، اربطي بأعلى السلاسل الثلاث"],
  [/Sl st into corner sp; in each corner sp work \(3 dc, ch 2, 3 dc\), ch 1, \(3 dc, ch 1\) in each of the next (\d+) ch-1 sp; repeat around x4, join/g, "غرزة منزلقة لفراغ الزاوية؛ في كل زاوية (٣ عمود، ٢ سلسلة، ٣ عمود)، سلسلة، (٣ عمود، سلسلة) في كل فراغ من الـ $1 فراغات التالية؛ كرري ×٤، اربطي"],
  [/Sl st into corner sp; in each corner sp work \(3 dc, ch 2, 3 dc\), ch 1; repeat around x4, join/g, "غرزة منزلقة لفراغ الزاوية؛ في كل زاوية (٣ عمود، ٢ سلسلة، ٣ عمود)، سلسلة؛ كرري ×٤، اربطي"],
  [/ch (\d+), sc in 2nd ch from hook and in each ch across/g, "$1 سلسلة، مفردة في ثاني سلسلة من الإبرة وفي كل سلسلة للآخر"],
  [/ch 1, turn, sc in each st across/g, "سلسلة، اقلبي، مفردة في كل غرزة للآخر"],
  [/(\d+) sc in magic ring/g, "$1 مفردة في الحلقة السحرية"],
  [/sc in each st/g, "مفردة في كل غرزة"],
  [/inc in each st/g, "زيادة في كل غرزة"],
  [/\binc\b/g, "زيادة"],
  [/\bdec\b/g, "نقص"],
  [/\bsc\b/g, "مفردة"],
  [/\bdc\b/g, "عمود"],
  [/ x(\d+)/g, " ×$1"],
  [/, /g, "، "],
];

const FINISH: Record<string, string> = {
  "Fasten off, stuff, and close.": "اقفلي، احشي، وسكّري.",
  "Fasten off, leaving a long tail. Flatten; do not stuff.": "اقفلي واتركي ذيل طويل. افردي القطعة بدون حشو.",
  "Fasten off, leaving a long tail for sewing.": "اقفلي واتركي ذيل طويل للخياطة.",
  "Fasten off and weave in the ends.": "اقفلي وخبّي أطراف الخيط.",
};

const PART_NAMES: Record<string, string> = {
  Head: "الرأس",
  Body: "الجسم",
  Ear: "الأذن",
  Arm: "اليد",
  Tail: "الذيل",
  Wing: "الجناح",
  Beak: "المنقار",
  "Front and back": "الأمام والخلف",
  Strap: "الحزام",
  Square: "المربع",
  Front: "الأمام",
  Back: "الخلف",
  "Shoulder strap": "حمّالة الكتف",
  "Front panel": "القطعة الأمامية",
  Sleeve: "الكم",
  Scarf: "السكارف",
  Blanket: "البطانية",
  Coaster: "الكوستر",
  "Granny square": "مربع الجراني",
};

export function instructionAr(text: string): string {
  return PHRASES.reduce((s, [re, rep]) => s.replace(re, rep), text);
}

export function finishAr(text: string): string {
  return FINISH[text] ?? text;
}

export function partNameAr(name: string): string {
  return PART_NAMES[name] ?? name;
}

export function assemblyAr(text: string): string {
  let m = /^(Stuff firmly, then attach|Attach) (?:(\d+) × )?(.+?) to (.+?) between rounds (\d+) and (\d+)( on opposite sides)?, leaving a long tail\.$/.exec(text);
  if (m) {
    const [, verb, count, child, parent, a, b, sides] = m;
    const prep = verb.startsWith("Stuff") ? "احشي زين، وبعدين ركّبي" : "ركّبي";
    return `${prep} ${count ? `${count} × ` : ""}${partNameAr(child)} على ${partNameAr(parent)} بين الراوند ${a} و ${b}${sides ? " على الجهتين" : ""}، واتركي ذيل طويل.`;
  }
  m = /^(Stuff firmly, then attach|Attach) (?:(\d+) × )?(.+?) to (.+?), sewing through both layers\.$/.exec(text);
  if (m) {
    const [, verb, count, child, parent] = m;
    const prep = verb.startsWith("Stuff") ? "احشي زين، وبعدين ركّبي" : "ركّبي";
    return `${prep} ${count ? `${count} × ` : ""}${partNameAr(child)} على ${partNameAr(parent)} بالخياطة من الطبقتين.`;
  }
  return text;
}
