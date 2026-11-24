// Turns a photo (and/or words) into a DesignSpec with a vision model. The model only describes the
// piece: which parts, their shapes, proportions and yarn colours. Stitch counts are never asked of
// it: the engine computes every round from the spec, so the pattern always adds up.
import { z } from "zod";
import { DesignSpecSchema, PART_SHAPES, type DesignSpec } from "@/lib/spec/schema";

export const AiDesignSchema = z.object({
  title: z.object({ en: z.string().min(1).max(60), ar: z.string().min(1).max(60) }),
  heightCm: z.number().min(3).max(200),
  spec: DesignSpecSchema,
});
export type AiDesign = z.infer<typeof AiDesignSchema>;

export type MakeKind = "toy" | "bag" | "clothes" | "flat" | "other";

const KIND_HINT: Record<MakeKind, string> = {
  toy: "an amigurumi toy or doll, worked in the round (category amigurumi)",
  bag: "a bag. A bag worked in the round has a basket body (open top; dims.depth smaller than width for a flat bag, equal for a round bucket bag) and its handle or strap as a rectangle named \"Handle\" or \"Strap\" attached to the body at y = 1, with position.x = where the handle ends sit (0.3 to 0.9 of the half width) and quantity 2 when there is a handle on the front and on the back. Its height is the handle's length along its curve; a crossbody strap is long (about 3 to 4 times the bag width). Use category amigurumi. A bag made of flat panels or granny squares uses rectangle or granny_square parts (category flat) plus the same strap parts",
  clothes: "a garment, made of flat rectangle panels or granny_square motifs (category flat): front, back, sleeves, straps, bands",
  flat: "a flat piece: blanket, scarf, coaster, cushion cover (category flat)",
  other: "any crochet piece; pick the category that fits",
};

export function systemPrompt(): string {
  return [
    "You are a crochet designer. You look at a photo of a crocheted piece (or read a description) and describe how to build it from simple crochet parts.",
    "Describe only what you can see. Do not invent parts that are not there.",
    `Allowed part shapes: ${PART_SHAPES.join(", ")}.`,
    "sphere, ellipsoid, cylinder, cone, capsule and ear are worked in the round from a magic ring (closed, stuffed shapes). basket is worked in the round with a flat base and straight walls and stays open at the top: use it for bag bodies, baskets and pots. rectangle is worked flat in rows. granny_square is a classic square motif.",
    "Match the photo's proportions closely: measure width, height and depth against each other in the photo, so the 3D model built from your answer looks like the photographed piece.",
    "dims are relative proportions (width, height, depth); the largest dimension of the whole piece is about 1. overallHeightRatio is the total height of the assembled piece in the same units.",
    "position (x, y, z from -1 to 1) is where a part sits on its parent (attachTo): y = 1 top, -1 bottom; x = 1 right; z = 1 front. The main part has attachTo null and position 0,0,0.",
    "Use quantity for mirrored pairs (two ears, two arms, two straps) and describe one of them with x > 0.",
    "Each part has one yarn colour (hex) sampled from the photo. If a part is striped or has a band of another colour, split it into separate parts.",
    "heightCm is the realistic finished height in centimetres for this kind of piece at the requested size.",
    "title is a short name of the piece in English and in Gulf Arabic.",
    "notes: one or two sentences for the maker (stitch texture you see, embellishments the pattern does not cover such as embroidery, beads or charms).",
    "confidence: how sure you are, 0 to 1.",
    "Part ids: lowercase letters, numbers, - or _. Max 12 parts.",
  ].join("\n");
}

export function userPrompt(kind: MakeKind, size: "small" | "medium" | "large", text: string): string {
  return [
    `The maker wants ${KIND_HINT[kind]}.`,
    `Requested size: ${size}.`,
    text ? `Their words: "${text.slice(0, 500)}"` : "They gave no words; work from the photo.",
    "Return the design.",
  ].join("\n");
}

const num = { type: "number" };
const vec = (keys: string[]) => ({ type: "object", properties: Object.fromEntries(keys.map((k) => [k, num])), required: keys });

/** JSON Schema of AiDesign, for tool use / structured output. */
export const AI_DESIGN_JSON_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "object", properties: { en: { type: "string" }, ar: { type: "string" } }, required: ["en", "ar"] },
    heightCm: num,
    spec: {
      type: "object",
      properties: {
        category: { type: "string", enum: ["amigurumi", "flat", "other"] },
        confidence: num,
        overallHeightRatio: num,
        notes: { type: "string" },
        parts: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              shape: { type: "string", enum: [...PART_SHAPES] },
              dims: vec(["width", "height", "depth"]),
              colorHex: { type: "string" },
              quantity: { type: "integer" },
              attachTo: { type: ["string", "null"] },
              position: vec(["x", "y", "z"]),
            },
            required: ["id", "name", "shape", "dims", "colorHex", "quantity", "attachTo", "position"],
          },
        },
      },
      required: ["category", "confidence", "overallHeightRatio", "notes", "parts"],
    },
  },
  required: ["title", "heightCm", "spec"],
} as const;

/** Small repairs before validation: clamp ranges, fix hex case, drop dangling attachments. */
export function tidy(raw: unknown): unknown {
  const d = raw as AiDesign;
  if (!d || typeof d !== "object" || !d.spec || !Array.isArray(d.spec.parts)) return raw;
  const clamp = (v: number, lo: number, hi: number) => (Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : 0);
  const parts = d.spec.parts.slice(0, 12).map((p, i) => ({
    ...p,
    id: String(p.id || `part${i}`).toLowerCase().replace(/[^a-z0-9_-]/g, "-").slice(0, 40) || `part${i}`,
    name: String(p.name || `Part ${i + 1}`).slice(0, 60),
    colorHex: /^#[0-9a-f]{6}$/i.test(p.colorHex) ? p.colorHex.toUpperCase() : "#C9785C",
    quantity: Math.round(clamp(p.quantity ?? 1, 1, 20)),
    dims: { width: clamp(p.dims?.width, 0.02, 1000) || 0.5, height: clamp(p.dims?.height, 0.02, 1000) || 0.5, depth: clamp(p.dims?.depth, 0.02, 1000) || 0.5 },
    position: { x: clamp(p.position?.x, -1, 1), y: clamp(p.position?.y, -1, 1), z: clamp(p.position?.z, -1, 1) },
  }));
  const ids = new Set(parts.map((p) => p.id));
  const fixed = parts.map((p) => ({ ...p, attachTo: p.attachTo && ids.has(p.attachTo) && p.attachTo !== p.id ? p.attachTo : null }));
  const seen = new Set<string>();
  const unique = fixed.filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)));
  return {
    ...d,
    heightCm: clamp(d.heightCm, 3, 200) || 20,
    spec: { ...d.spec, confidence: clamp(d.spec.confidence, 0, 1), overallHeightRatio: clamp(d.spec.overallHeightRatio, 0.05, 1000) || 1, notes: String(d.spec.notes ?? "").slice(0, 1000), parts: unique },
  };
}

export function parseDesign(raw: unknown): AiDesign | null {
  const r = AiDesignSchema.safeParse(tidy(raw));
  return r.success ? r.data : null;
}

export type { DesignSpec };
