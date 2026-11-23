import { z } from "zod";

// DesignSpec: what the AI (or the manual builder) describes. The AI never decides stitch counts.

export const PART_SHAPES = [
  "sphere",
  "ellipsoid",
  "cylinder",
  "cone",
  "capsule",
  "ear",
  "rectangle",
  "granny_square",
] as const;

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Color must be a hex value like #CE4F2F");
const unit = z.number().min(-1).max(1);

export const PartSpecSchema = z.object({
  id: z.string().min(1).max(40).regex(/^[a-z0-9_-]+$/i, "Use letters, numbers, - or _"),
  name: z.string().min(1).max(60),
  shape: z.enum(PART_SHAPES),
  dims: z.object({
    width: z.number().positive().max(1000),
    height: z.number().positive().max(1000),
    depth: z.number().positive().max(1000),
  }),
  colorHex: hex,
  quantity: z.number().int().min(1).max(20),
  attachTo: z.string().max(40).nullable(),
  position: z.object({ x: unit, y: unit, z: unit }),
});

export const DesignSpecSchema = z
  .object({
    category: z.enum(["amigurumi", "flat", "other"]),
    confidence: z.number().min(0).max(1),
    overallHeightRatio: z.number().positive().max(1000),
    parts: z.array(PartSpecSchema).min(1).max(24),
    notes: z.string().max(1000),
  })
  .superRefine((spec, ctx) => {
    const ids = new Set<string>();
    for (const p of spec.parts) {
      if (ids.has(p.id)) ctx.addIssue({ code: "custom", message: `Duplicate part id ${p.id}` });
      ids.add(p.id);
    }
    for (const p of spec.parts) {
      if (p.attachTo !== null && !ids.has(p.attachTo)) {
        ctx.addIssue({ code: "custom", message: `${p.name} attaches to unknown part ${p.attachTo}` });
      }
      if (p.attachTo === p.id) ctx.addIssue({ code: "custom", message: `${p.name} attaches to itself` });
    }
  });

export type PartSpec = z.infer<typeof PartSpecSchema>;
export type DesignSpec = z.infer<typeof DesignSpecSchema>;

export const GaugeSchema = z.object({
  stitchWidthCm: z.number().min(0.1).max(5),
  rowHeightCm: z.number().min(0.1).max(5),
});

/** Quality level from section 6: 1 amigurumi with 3D, 2 flat chart, 3 AI draft needing review. */
export function qualityLevel(spec: DesignSpec): 1 | 2 | 3 {
  if (spec.category === "amigurumi") return 1;
  if (spec.category === "flat") return 2;
  return 3;
}
