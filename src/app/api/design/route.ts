import { NextResponse } from "next/server";
import { z } from "zod";
import { AI_DESIGN_JSON_SCHEMA, parseDesign, systemPrompt, userPrompt, type AiDesign } from "@/lib/ai/design";

export const runtime = "nodejs";
export const maxDuration = 60;

const Body = z.object({
  kind: z.enum(["toy", "bag", "clothes", "flat", "other"]),
  size: z.enum(["small", "medium", "large"]),
  text: z.string().max(500).default(""),
  /** JPEG/PNG/WebP as a data URL, already downscaled in the browser. */
  image: z
    .string()
    .regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/)
    .max(3_000_000)
    .nullable()
    .default(null),
});

// A light per-address limit so a public demo cannot run up the bill (per server instance).
const hits = new Map<string, { day: string; n: number }>();
const DAILY = Number(process.env.AI_DAILY_LIMIT ?? 30);
function allow(ip: string): boolean {
  const day = new Date().toISOString().slice(0, 10);
  const h = hits.get(ip);
  if (!h || h.day !== day) {
    hits.set(ip, { day, n: 1 });
    return true;
  }
  if (h.n >= DAILY) return false;
  h.n++;
  return true;
}

export function GET() {
  return NextResponse.json({ ai: provider() });
}

function provider(): "anthropic" | "gemini" | null {
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.GEMINI_API_KEY) return "gemini";
  return null;
}

export async function POST(req: Request) {
  const which = provider();
  if (!which) return NextResponse.json({ error: "not-configured" }, { status: 503 });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!allow(ip)) return NextResponse.json({ error: "limit" }, { status: 429 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success || (!parsed.data.image && parsed.data.text.trim().length < 2)) return NextResponse.json({ error: "bad-input" }, { status: 400 });
  const { kind, size, text, image } = parsed.data;

  try {
    let design: AiDesign | null = null;
    for (let attempt = 0; attempt < 2 && !design; attempt++) {
      const raw = which === "anthropic" ? await askClaude(kind, size, text, image) : await askGemini(kind, size, text, image);
      design = parseDesign(raw);
    }
    if (!design) return NextResponse.json({ error: "unreadable" }, { status: 502 });
    return NextResponse.json({ design, provider: which });
  } catch (e) {
    console.error("design route", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "upstream" }, { status: 502 });
  }
}

const splitDataUrl = (url: string) => {
  const m = /^data:(image\/[a-z]+);base64,(.+)$/.exec(url)!;
  return { mime: m[1], data: m[2] };
};

async function askClaude(kind: Parameters<typeof userPrompt>[0], size: Parameters<typeof userPrompt>[1], text: string, image: string | null): Promise<unknown> {
  const content: unknown[] = [];
  if (image) {
    const { mime, data } = splitDataUrl(image);
    content.push({ type: "image", source: { type: "base64", media_type: mime, data } });
  }
  content.push({ type: "text", text: userPrompt(kind, size, text) });
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY!, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5",
      max_tokens: 3000,
      system: systemPrompt(),
      tools: [{ name: "design", description: "The crochet design for this piece.", input_schema: AI_DESIGN_JSON_SCHEMA }],
      tool_choice: { type: "tool", name: "design" },
      messages: [{ role: "user", content }],
    }),
  });
  if (!res.ok) throw new Error(`anthropic ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const json = (await res.json()) as { content: { type: string; input?: unknown }[] };
  return json.content.find((c) => c.type === "tool_use")?.input ?? null;
}

async function askGemini(kind: Parameters<typeof userPrompt>[0], size: Parameters<typeof userPrompt>[1], text: string, image: string | null): Promise<unknown> {
  const parts: unknown[] = [];
  if (image) {
    const { mime, data } = splitDataUrl(image);
    parts.push({ inline_data: { mime_type: mime, data } });
  }
  parts.push({ text: `${userPrompt(kind, size, text)}\nAnswer with JSON only, matching this JSON Schema:\n${JSON.stringify(AI_DESIGN_JSON_SCHEMA)}` });
  const model = process.env.GEMINI_MODEL || "gemini-3.8-flash";
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY! },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt() }] },
      contents: [{ role: "user", parts }],
      generationConfig: { responseMimeType: "application/json" },
    }),
  });
  if (!res.ok) throw new Error(`gemini ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const json = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const out = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  return JSON.parse(out.replace(/^```(?:json)?\s*|\s*```$/g, ""));
}
