import { describe, expect, it } from "vitest";
import { BALL_HEAD, BEAR_WITH_EARS } from "@/lib/spec/samples";
import { historyReducer, makePart, removePart, type EditorDoc, type History } from "./state";

const doc = (title: string): EditorDoc => ({
  title,
  spec: BALL_HEAD,
  targetHeightCm: 10,
  gauge: { kind: "preset", weight: "worsted" },
  terms: "us",
});

describe("editor history", () => {
  it("undoes and redoes", () => {
    let s: History = { past: [], present: doc("a"), future: [] };
    s = historyReducer(s, { type: "set", doc: doc("b") }, 0);
    s = historyReducer(s, { type: "set", doc: doc("c") }, 10_000);
    expect(s.present.title).toBe("c");
    s = historyReducer(s, { type: "undo" });
    expect(s.present.title).toBe("b");
    s = historyReducer(s, { type: "undo" });
    expect(s.present.title).toBe("a");
    s = historyReducer(s, { type: "redo" });
    expect(s.present.title).toBe("b");
  });

  it("merges one slider drag into a single step", () => {
    let s: History = { past: [], present: doc("a"), future: [] };
    s = historyReducer(s, { type: "set", doc: doc("b"), coalesceKey: "w" }, 1000);
    s = historyReducer(s, { type: "set", doc: doc("c"), coalesceKey: "w" }, 1100);
    s = historyReducer(s, { type: "set", doc: doc("d"), coalesceKey: "w" }, 1200);
    expect(s.past).toHaveLength(1);
    s = historyReducer(s, { type: "undo" });
    expect(s.present.title).toBe("a");
  });
});

describe("parts", () => {
  it("adds parts with unique ids attached to the root", () => {
    const p = makePart(BEAR_WITH_EARS.parts, "sphere", "#CE4F2F");
    expect(BEAR_WITH_EARS.parts.some((x) => x.id === p.id)).toBe(false);
    expect(p.attachTo).toBe("body");
  });

  it("detaches children when a parent is removed", () => {
    const next = removePart(BEAR_WITH_EARS, "head");
    expect(next.parts.find((p) => p.id === "ear")?.attachTo).toBeNull();
  });
});
