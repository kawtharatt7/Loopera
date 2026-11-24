import { z } from "zod";

// Custom-order requests (a wall hanging from your own picture, a doll made to look like someone,
// a bouquet you compose). They stay in this browser until accounts and a maker dashboard exist;
// the reference lets the maker find the request once it reaches her.

const KEY = "loopera-requests-v1";

export const RequestSchema = z.object({
  ref: z.string(),
  createdAt: z.string(),
  kind: z.enum(["general", "wall", "doll", "bouquet"]),
  subject: z.string().max(120),
  choices: z.record(z.string(), z.string().max(400)),
  colors: z.array(z.string().max(40)).max(12),
  note: z.string().max(1000),
  name: z.string().min(1).max(80),
  phone: z.string().min(6).max(30),
  estimate: z.number().nullable(),
  hasPicture: z.boolean(),
});
export type CustomRequest = z.infer<typeof RequestSchema>;

export function makeRef(now = new Date()): string {
  const n = Math.floor(Math.random() * 9000) + 1000;
  return `LP-${now.getFullYear().toString().slice(2)}${String(now.getMonth() + 1).padStart(2, "0")}-${n}`;
}

export function readRequests(): CustomRequest[] {
  try {
    const parsed = z.array(RequestSchema).safeParse(JSON.parse(localStorage.getItem(KEY) ?? "[]"));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

export function saveRequest(r: Omit<CustomRequest, "ref" | "createdAt">): CustomRequest {
  const full = RequestSchema.parse({ ...r, ref: makeRef(), createdAt: new Date().toISOString() });
  try {
    localStorage.setItem(KEY, JSON.stringify([full, ...readRequests()].slice(0, 50)));
  } catch {
    // Storage blocked: the request still gets its reference for this visit.
  }
  return full;
}

/** Bouquet price by number of stems (SAR). */
export function bouquetPrice(stems: number): number {
  return stems <= 3 ? 95 : stems <= 6 ? 150 : 220;
}
