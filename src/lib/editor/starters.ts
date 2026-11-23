import type { DesignSpec } from "@/lib/spec/schema";
import { BALL_HEAD, BEAR_WITH_EARS, GRANNY_SQUARE } from "@/lib/spec/samples";
import type { EditorDoc } from "./state";

export const STARTERS = {
  blank: {
    label: "Blank",
    blurb: "Start from one ball and build it up.",
    title: "Untitled design",
    height: 8,
    spec: { ...BALL_HEAD, notes: "" } satisfies DesignSpec,
  },
  ball: { label: "Ball head", blurb: "The classic first amigurumi.", title: "Ball head", height: 8, spec: BALL_HEAD },
  bear: { label: "Bear with ears", blurb: "Body, head, ears and arms.", title: "Little bear", height: 15, spec: BEAR_WITH_EARS },
  granny: { label: "Granny square", blurb: "A flat classic, charted round by round.", title: "Granny square", height: 12, spec: GRANNY_SQUARE },
} as const;

export type StarterKey = keyof typeof STARTERS;

export function isStarterKey(v: string | undefined): v is StarterKey {
  return v !== undefined && v in STARTERS;
}

export function starterDoc(key: StarterKey): EditorDoc {
  const s = STARTERS[key];
  return {
    title: s.title,
    spec: s.spec,
    targetHeightCm: s.height,
    gauge: { kind: "preset", weight: "worsted" },
    terms: "us",
  };
}
