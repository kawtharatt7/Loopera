"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { PART_SHAPES, type PartSpec } from "@/lib/spec/schema";
import { SHAPE_DEFAULTS } from "@/lib/editor/state";
import type { PartShape } from "@/lib/engine/types";
import { ColorField, SelectField, SliderField } from "./fields";

interface PartCardProps {
  part: PartSpec;
  others: PartSpec[];
  /** cm per relative unit, so sliders can show real centimetres. */
  scale: number;
  onChange: (next: PartSpec, coalesceKey?: string) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  canRemove: boolean;
  defaultOpen?: boolean;
}

const FLAT: PartShape[] = ["rectangle", "granny_square"];

export function PartCard({ part, others, scale, onChange, onRemove, onDuplicate, canRemove, defaultOpen = false }: PartCardProps) {
  const [open, setOpen] = useState(defaultOpen);
  const flat = FLAT.includes(part.shape);
  const set = (patch: Partial<PartSpec>, key?: string) => onChange({ ...part, ...patch }, key);
  const dim = (k: "width" | "height" | "depth", cm: number) =>
    set({ dims: { ...part.dims, [k]: Math.max(0.01, cm / scale) } }, `${part.id}-${k}`);

  return (
    <li className="rounded-xl border border-line/10 bg-bg/50">
      <div className="flex items-center gap-2 p-2 pl-3">
        <span className="h-4 w-4 shrink-0 rounded-full ring-1 ring-line/20" style={{ backgroundColor: part.colorHex }} aria-hidden="true" />
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex min-h-11 flex-1 cursor-pointer items-center justify-between gap-2 rounded-xl px-2 text-left"
        >
          <span className="font-medium">
            {part.name}
            {part.quantity > 1 && <span className="text-muted-foreground"> × {part.quantity}</span>}
          </span>
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            {SHAPE_DEFAULTS[part.shape].label}
            <svg viewBox="0 0 20 20" className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M5 8l5 5 5-5" />
            </svg>
          </span>
        </button>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="space-y-4 border-t border-line/10 p-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor={`${part.id}-name`} className="text-sm text-muted-foreground">
                    Name
                  </label>
                  <input
                    id={`${part.id}-name`}
                    value={part.name}
                    maxLength={60}
                    onChange={(e) => set({ name: e.target.value || " " }, `${part.id}-name`)}
                    className="mt-1 min-h-11 w-full rounded-xl border border-line/15 bg-bg/60 px-3"
                  />
                </div>
                <SelectField
                  label="Shape"
                  value={part.shape}
                  options={PART_SHAPES.map((s) => ({ value: s, label: SHAPE_DEFAULTS[s].label }))}
                  onChange={(shape) => set({ shape, attachTo: FLAT.includes(shape) ? null : part.attachTo })}
                />
              </div>

              <SliderField label={flat ? "Width" : "Width (widest)"} unit="cm" value={part.dims.width * scale} min={0.5} max={60} step={0.1} onChange={(v) => dim("width", v)} />
              <SliderField label="Height" unit="cm" value={part.dims.height * scale} min={0.5} max={60} step={0.1} onChange={(v) => dim("height", v)} />
              {!flat && <SliderField label="Depth" unit="cm" value={part.dims.depth * scale} min={0.5} max={60} step={0.1} onChange={(v) => dim("depth", v)} />}

              <ColorField label="Yarn color" value={part.colorHex} onChange={(hex) => set({ colorHex: hex }, `${part.id}-color`)} />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-sm text-muted-foreground">Quantity</span>
                  <div className="mt-1 flex items-center rounded-xl border border-line/15 bg-bg/60">
                    <button type="button" aria-label="One fewer" onClick={() => set({ quantity: Math.max(1, part.quantity - 1) })} className="h-11 w-11 cursor-pointer text-lg">
                      −
                    </button>
                    <span className="flex-1 text-center tabular-nums" aria-live="polite">
                      {part.quantity}
                    </span>
                    <button type="button" aria-label="One more" onClick={() => set({ quantity: Math.min(20, part.quantity + 1) })} className="h-11 w-11 cursor-pointer text-lg">
                      +
                    </button>
                  </div>
                </div>
                {!flat && (
                  <SelectField
                    label="Attach to"
                    value={part.attachTo ?? ""}
                    options={[{ value: "", label: "Nothing (main part)" }, ...others.filter((o) => !FLAT.includes(o.shape)).map((o) => ({ value: o.id, label: o.name }))]}
                    onChange={(v) => set({ attachTo: v === "" ? null : v })}
                  />
                )}
              </div>

              {part.attachTo && (
                <div className="grid grid-cols-2 gap-3">
                  <SliderField label="Attach height" value={part.position.y} min={-1} max={1} step={0.05} onChange={(v) => set({ position: { ...part.position, y: v } }, `${part.id}-py`)} />
                  <SliderField label="Side" value={part.position.x} min={-1} max={1} step={0.05} onChange={(v) => set({ position: { ...part.position, x: v } }, `${part.id}-px`)} />
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={onDuplicate} className="min-h-10 cursor-pointer rounded-sm border border-line/15 px-4 text-sm hover:bg-surface-2">
                  Duplicate
                </button>
                {canRemove && (
                  <button type="button" onClick={onRemove} className="min-h-10 cursor-pointer rounded-sm px-4 text-sm text-brand hover:bg-surface-2">
                    Remove
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}
