import type { DesignSpec, PartSpec } from "@/lib/spec/schema";
import type { YarnWeight } from "@/lib/engine/gauge";
import type { Terms } from "@/lib/engine/terms";
import type { PartShape } from "@/lib/engine/types";

export type GaugeSource =
  | { kind: "preset"; weight: YarnWeight }
  | { kind: "swatch"; stitchesPer10cm: number; rowsPer10cm: number };

export interface EditorDoc {
  title: string;
  spec: DesignSpec;
  targetHeightCm: number;
  gauge: GaugeSource;
  terms: Terms;
}

export interface History {
  past: EditorDoc[];
  present: EditorDoc;
  future: EditorDoc[];
}

export const HISTORY_LIMIT = 100;

export type EditorAction =
  | { type: "set"; doc: EditorDoc; coalesceKey?: string }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "reset"; doc: EditorDoc };

/**
 * Undo history. Rapid changes with the same coalesceKey (one slider drag) are merged into
 * a single undo step, so undo goes back to before the drag rather than one pixel at a time.
 */
export function historyReducer(state: History & { lastKey?: string; lastAt?: number }, action: EditorAction, now = Date.now()) {
  switch (action.type) {
    case "set": {
      const merge = action.coalesceKey !== undefined && action.coalesceKey === state.lastKey && now - (state.lastAt ?? 0) < 800;
      if (merge) return { ...state, present: action.doc, future: [], lastAt: now };
      const past = [...state.past, state.present].slice(-HISTORY_LIMIT);
      return { past, present: action.doc, future: [], lastKey: action.coalesceKey, lastAt: now };
    }
    case "undo": {
      if (state.past.length === 0) return state;
      const prev = state.past[state.past.length - 1];
      return { past: state.past.slice(0, -1), present: prev, future: [state.present, ...state.future], lastKey: undefined };
    }
    case "redo": {
      if (state.future.length === 0) return state;
      const [next, ...rest] = state.future;
      return { past: [...state.past, state.present], present: next, future: rest, lastKey: undefined };
    }
    case "reset":
      return { past: [], present: action.doc, future: [], lastKey: undefined };
  }
}

/** Default dimensions (relative units) for a newly added part of each shape. */
export const SHAPE_DEFAULTS: Record<PartShape, { width: number; height: number; depth: number; label: string }> = {
  sphere: { width: 0.6, height: 0.6, depth: 0.6, label: "Ball" },
  ellipsoid: { width: 0.6, height: 0.8, depth: 0.55, label: "Egg / body" },
  cylinder: { width: 0.4, height: 0.6, depth: 0.4, label: "Tube" },
  basket: { width: 1, height: 0.8, depth: 1, label: "Bag body (open top)" },
  cone: { width: 0.4, height: 0.5, depth: 0.4, label: "Cone" },
  capsule: { width: 0.25, height: 0.6, depth: 0.25, label: "Limb" },
  ear: { width: 0.3, height: 0.25, depth: 0.1, label: "Ear" },
  rectangle: { width: 1, height: 0.6, depth: 0.05, label: "Rectangle" },
  granny_square: { width: 1, height: 1, depth: 0.05, label: "Granny square" },
};

export function newPartId(existing: string[], shape: PartShape): string {
  const base = shape.replace("_", "-");
  let i = 1;
  while (existing.includes(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}

export function makePart(existing: PartSpec[], shape: PartShape, colorHex: string): PartSpec {
  const d = SHAPE_DEFAULTS[shape];
  const root = existing.find((p) => p.attachTo === null);
  const flat = shape === "rectangle" || shape === "granny_square";
  return {
    id: newPartId(existing.map((p) => p.id), shape),
    name: d.label,
    shape,
    dims: { width: d.width, height: d.height, depth: d.depth },
    colorHex,
    quantity: 1,
    attachTo: root && !flat ? root.id : null,
    position: { x: 0.7, y: 0.4, z: 0 },
  };
}

/** Removing a part also detaches anything that was attached to it. */
export function removePart(spec: DesignSpec, id: string): DesignSpec {
  const parts = spec.parts.filter((p) => p.id !== id).map((p) => (p.attachTo === id ? { ...p, attachTo: null } : p));
  return { ...spec, parts };
}

/** Category follows the parts: any flat part and no 3D parts makes it a flat item. */
export function inferCategory(spec: DesignSpec): DesignSpec["category"] {
  const flat = spec.parts.every((p) => p.shape === "rectangle" || p.shape === "granny_square");
  if (spec.category === "other") return "other";
  return flat ? "flat" : "amigurumi";
}
