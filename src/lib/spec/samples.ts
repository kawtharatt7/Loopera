import type { DesignSpec } from "./schema";

// The three sample designs used by seed data, the viewer demo and DEMO_MODE.

export const BALL_HEAD: DesignSpec = {
  category: "amigurumi",
  confidence: 0.95,
  overallHeightRatio: 1,
  parts: [
    {
      id: "head",
      name: "Head",
      shape: "sphere",
      dims: { width: 1, height: 1, depth: 1 },
      colorHex: "#E29B6A",
      quantity: 1,
      attachTo: null,
      position: { x: 0, y: 0, z: 0 },
    },
  ],
  notes: "A simple ball head: the classic first amigurumi.",
};

export const BEAR_WITH_EARS: DesignSpec = {
  category: "amigurumi",
  confidence: 0.88,
  overallHeightRatio: 2,
  parts: [
    {
      id: "body",
      name: "Body",
      shape: "ellipsoid",
      dims: { width: 0.9, height: 1.05, depth: 0.85 },
      colorHex: "#8E1523",
      quantity: 1,
      attachTo: null,
      position: { x: 0, y: 0, z: 0 },
    },
    {
      id: "head",
      name: "Head",
      shape: "sphere",
      dims: { width: 0.95, height: 0.95, depth: 0.95 },
      colorHex: "#CE4F2F",
      quantity: 1,
      attachTo: "body",
      position: { x: 0, y: 1, z: 0 },
    },
    {
      id: "ear",
      name: "Ear",
      shape: "ear",
      dims: { width: 0.32, height: 0.25, depth: 0.12 },
      colorHex: "#CE4F2F",
      quantity: 2,
      attachTo: "head",
      position: { x: 0.6, y: 0.5, z: 0 },
    },
    {
      id: "arm",
      name: "Arm",
      shape: "capsule",
      dims: { width: 0.22, height: 0.6, depth: 0.22 },
      colorHex: "#8E1523",
      quantity: 2,
      attachTo: "body",
      position: { x: 0.9, y: 0.4, z: 0 },
    },
  ],
  notes: "A small bear: body, round head, two ears and two arms.",
};

export const GRANNY_SQUARE: DesignSpec = {
  category: "flat",
  confidence: 0.92,
  overallHeightRatio: 1,
  parts: [
    {
      id: "square",
      name: "Granny square",
      shape: "granny_square",
      dims: { width: 1, height: 1, depth: 0.05 },
      colorHex: "#F3B6B6",
      quantity: 1,
      attachTo: null,
      position: { x: 0, y: 0, z: 0 },
    },
  ],
  notes: "A classic granny square.",
};

export const SAMPLE_SPECS = { BALL_HEAD, BEAR_WITH_EARS, GRANNY_SQUARE } as const;
