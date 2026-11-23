import type { DesignSpec } from "@/lib/spec/schema";
import { buildGrannySquare, buildRectangle } from "./flat";
import { buildRevolutionPart } from "./revolution";
import type { AssemblyStep, EnginePart, Gauge, Pattern, PartPattern } from "./types";
import { validatePart } from "./validate";

export * from "./types";
export { estimate, ESTIMATE_CONSTANTS } from "./estimates";
export { YARN_PRESETS, presetFor, gaugeFromSwatch } from "./gauge";
export { toTerms, ABBREVIATIONS } from "./terms";
export { validatePart, PatternValidationError, parseInstruction } from "./validate";

/** Converts relative DesignSpec dimensions to centimetres using the user's target height. */
export function scaleSpec(spec: DesignSpec, targetHeightCm: number): EnginePart[] {
  if (!(targetHeightCm > 0)) throw new Error("Target height must be positive");
  const scale = targetHeightCm / spec.overallHeightRatio;
  return spec.parts.map((p) => ({
    id: p.id,
    name: p.name,
    shape: p.shape,
    widthCm: p.dims.width * scale,
    heightCm: p.dims.height * scale,
    depthCm: p.dims.depth * scale,
    colorHex: p.colorHex,
    quantity: p.quantity,
    attachTo: p.attachTo,
    position: p.position,
  }));
}

export function buildPart(part: EnginePart, gauge: Gauge): PartPattern {
  const built =
    part.shape === "rectangle"
      ? buildRectangle(part, gauge)
      : part.shape === "granny_square"
        ? buildGrannySquare(part, gauge)
        : buildRevolutionPart(part, gauge);
  validatePart(built);
  return built;
}

/** Round on the parent nearest to a y position from -1 (round 1) to 1 (last round). */
export function attachRound(parent: PartPattern, y: number): number {
  const n = parent.rounds.length;
  if (n <= 1) return 1;
  const r = Math.round(((y + 1) / 2) * n);
  return Math.min(n - 1, Math.max(1, r));
}

/** Orders parts so every parent comes before its children (cycles fall back to input order). */
function assemblyOrder(parts: EnginePart[]): EnginePart[] {
  const byId = new Map(parts.map((p) => [p.id, p]));
  const out: EnginePart[] = [];
  const seen = new Set<string>();
  const visit = (p: EnginePart, stack: Set<string>) => {
    if (seen.has(p.id) || stack.has(p.id)) return;
    stack.add(p.id);
    const parent = p.attachTo ? byId.get(p.attachTo) : undefined;
    if (parent) visit(parent, stack);
    seen.add(p.id);
    out.push(p);
  };
  parts.forEach((p) => visit(p, new Set()));
  return out;
}

export function buildAssembly(parts: EnginePart[], built: Map<string, PartPattern>): AssemblyStep[] {
  const steps: AssemblyStep[] = [];
  for (const part of assemblyOrder(parts)) {
    if (!part.attachTo) continue;
    const parent = built.get(part.attachTo);
    const child = built.get(part.id);
    if (!parent || !child) continue;
    const prep = child.closed ? "Stuff firmly, then attach" : "Attach";
    const count = part.quantity > 1 ? `${part.quantity} × ${part.name}` : part.name;
    if (parent.kind === "revolution") {
      const r = attachRound(parent, part.position.y);
      const side = part.quantity > 1 ? " on opposite sides" : "";
      steps.push({
        partId: part.id,
        text: `${prep} ${count} to ${parent.name} between rounds ${r} and ${r + 1}${side}, leaving a long tail.`,
      });
    } else {
      steps.push({ partId: part.id, text: `${prep} ${count} to ${parent.name}, sewing through both layers.` });
    }
  }
  return steps;
}

/** Generates and validates the full pattern. Throws PatternValidationError if any round is inconsistent. */
export function generatePattern(spec: DesignSpec, targetHeightCm: number, gauge: Gauge): Pattern {
  const parts = scaleSpec(spec, targetHeightCm);
  const built = new Map<string, PartPattern>();
  for (const p of parts) built.set(p.id, buildPart(p, gauge));
  const list = parts.map((p) => built.get(p.id) as PartPattern);
  return {
    parts: list,
    assembly: buildAssembly(parts, built),
    totalStitches: list.reduce((a, p) => a + p.totalStitches * p.quantity, 0),
  };
}
