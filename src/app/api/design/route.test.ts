import { afterEach, describe, expect, it, vi } from "vitest";
import { generatePattern, presetFor } from "@/lib/engine";
import type { AiDesign } from "@/lib/ai/design";
import { GET, POST } from "./route";

const design = {
  title: { en: "Blue daisy bag", ar: "شنطة زرقاء" },
  heightCm: 22,
  spec: {
    category: "amigurumi",
    confidence: 0.85,
    overallHeightRatio: 1.4,
    notes: "Bead strand and daisy charm added after.",
    parts: [
      { id: "body", name: "Body", shape: "basket", dims: { width: 1, height: 0.75, depth: 0.5 }, colorHex: "#5E7894", quantity: 1, attachTo: null, position: { x: 0, y: 0, z: 0 } },
      { id: "handle", name: "Handle", shape: "rectangle", dims: { width: 0.09, height: 1.1, depth: 0.05 }, colorHex: "#5E7894", quantity: 1, attachTo: "body", position: { x: 0.55, y: 1, z: 0 } },
    ],
  },
};
const geminiReply = (obj: unknown) => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(obj) }] } }] }), { status: 200 });
const post = (body: unknown) => new Request("http://x/api/design", { method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": `1.2.3.${Math.random()}` }, body: JSON.stringify(body) });

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("POST /api/design with Gemini", () => {
  it("skips a missing model, reads the design and the engine turns it into a real pattern", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    vi.stubEnv("GEMINI_MODEL", "gemini-does-not-exist");
    const calls: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init: RequestInit) => {
        calls.push(url);
        expect((init.headers as Record<string, string>)["x-goog-api-key"]).toBe("test-key");
        return url.includes("gemini-does-not-exist") ? new Response("not found", { status: 404 }) : geminiReply(design);
      }),
    );
    const res = await POST(post({ kind: "bag", size: "medium", text: "", image: "data:image/jpeg;base64,AAAA" }));
    expect(res.status).toBe(200);
    const { design: d } = (await res.json()) as { design: AiDesign };
    expect(calls[0]).toContain("gemini-does-not-exist");
    expect(calls[1]).toContain("gemini-flash-latest");
    const pattern = generatePattern(d.spec, d.heightCm, presetFor("worsted").gauge);
    const body = pattern.parts.find((p) => p.partId === "body")!;
    expect(body.rounds[0].stitches).toBe(6);
    expect(body.closed).toBe(false);
    expect(body.rounds.length).toBeGreaterThan(10);
  });

  it("reports a failure instead of inventing a design", async () => {
    vi.stubEnv("GEMINI_API_KEY", "bad");
    vi.stubGlobal("fetch", vi.fn(async () => new Response("API key not valid", { status: 400 })));
    const res = await POST(post({ kind: "toy", size: "small", text: "bear", image: null }));
    expect(res.status).toBe(502);
    expect(((await res.json()) as { error: string }).error).toBe("key");
  });

  it("the check link does a real call and reports the model", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    vi.stubGlobal("fetch", vi.fn(async () => geminiReply("ok")));
    const res = await GET(new Request("http://x/api/design?check=1"));
    expect(await res.json()).toEqual({ ai: "gemini", check: { ok: true, model: "gemini-flash-latest" } });
  });
});
