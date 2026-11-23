// Shared types for the pattern engine. The engine is pure TypeScript: no AI, no UI.

/** Gauge in centimetres: the width of one stitch and the height of one row or round. */
export interface Gauge {
  stitchWidthCm: number;
  rowHeightCm: number;
}

export type RevolutionShape = "sphere" | "ellipsoid" | "cylinder" | "cone" | "capsule" | "ear";
export type FlatShape = "rectangle" | "granny_square";
export type PartShape = RevolutionShape | FlatShape;

/** A part after scaling: every dimension is in centimetres. */
export interface EnginePart {
  id: string;
  name: string;
  shape: PartShape;
  widthCm: number;
  heightCm: number;
  depthCm: number;
  colorHex: string;
  quantity: number;
  attachTo: string | null;
  /** Position on the parent, each axis from -1 to 1 in the parent's own frame. */
  position: { x: number; y: number; z: number };
  /** Keep every round a multiple of 6 (default on for spheres and capsules). */
  snapToSix?: boolean;
}

/** One operation in run-length form. */
export type StitchOp = "mr" | "sc" | "inc" | "dec" | "ch" | "dc" | "turn" | "join";

export interface RunItem {
  op: StitchOp;
  count: number;
}

/** A repeated group, for example (3 sc, inc) x6 is { repeat: 6, seq: [{sc,3},{inc,1}] }. */
export interface RunGroup {
  repeat: number;
  seq: RunItem[];
}

export interface Round {
  /** 1-based round or row number. */
  number: number;
  /** Stitches at the end of this round. */
  stitches: number;
  /** Human-readable instruction in US terms, without the stitch count. */
  instruction: string;
  /** Structured run-length form used by the validator and the 3D viewer. */
  runs: RunGroup[];
  /** Ring radius in cm, used by the 3D viewer. */
  radiusCm: number;
  /** Height of the ring along the part axis in cm, used by the 3D viewer. */
  yCm: number;
}

export type PartKind = "revolution" | "rectangle" | "granny_square";

export interface PartPattern {
  partId: string;
  name: string;
  shape: PartShape;
  kind: PartKind;
  colorHex: string;
  quantity: number;
  closed: boolean;
  rounds: Round[];
  /** Short finishing line, for example "Fasten off, stuff, and close." */
  finish: string;
  totalStitches: number;
}

export interface AssemblyStep {
  partId: string;
  text: string;
}

export interface Pattern {
  parts: PartPattern[];
  assembly: AssemblyStep[];
  totalStitches: number;
}
