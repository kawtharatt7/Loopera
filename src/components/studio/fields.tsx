"use client";

import { useId, type ReactNode } from "react";

/** Labelled slider with its value shown and editable as a number. */
export function SliderField({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
  onCommit,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (v: number) => void;
  onCommit?: () => void;
}) {
  const id = useId();
  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-sm text-muted-foreground">
          {label}
        </label>
        <span className="flex items-center gap-1 text-sm">
          <input
            type="number"
            inputMode="decimal"
            aria-label={`${label} value`}
            value={Number(value.toFixed(2))}
            min={min}
            max={max}
            step={step}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (Number.isFinite(v)) onChange(clamp(v));
            }}
            className="w-16 rounded-lg border border-line/15 bg-bg/60 px-2 py-1 text-right tabular-nums"
          />
          {unit && <span className="text-muted-foreground">{unit}</span>}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        onPointerUp={onCommit}
        onKeyUp={onCommit}
        className="mt-1 w-full accent-[rgb(var(--primary))]"
      />
    </div>
  );
}

/** Yarn color presets: the brand palette plus common yarn shades. These are data, picked by the user. */
export const COLOR_PRESETS = [
  { name: "Wine", hex: "#8E1523" },
  { name: "Ember", hex: "#CE4F2F" },
  { name: "Peach", hex: "#E29B6A" },
  { name: "Rose", hex: "#F3B6B6" },
  { name: "Cream", hex: "#F6EBDD" },
  { name: "Oat", hex: "#D9C3A5" },
  { name: "Cocoa", hex: "#5A3A2E" },
  { name: "Sage", hex: "#9DB39A" },
  { name: "Sky", hex: "#9EC1D9" },
  { name: "Charcoal", hex: "#3A3535" },
] as const;

export function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (hex: string) => void }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="text-sm text-muted-foreground">
        {label}
      </label>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {COLOR_PRESETS.map((c) => (
          <button
            key={c.hex}
            type="button"
            onClick={() => onChange(c.hex)}
            aria-label={`${c.name}${value.toUpperCase() === c.hex ? " (selected)" : ""}`}
            title={c.name}
            className={`h-7 w-7 cursor-pointer rounded-full ring-offset-2 ring-offset-surface transition-transform hover:scale-110 ${
              value.toUpperCase() === c.hex ? "ring-2 ring-fg" : "ring-1 ring-line/20"
            }`}
            style={{ backgroundColor: c.hex }}
          />
        ))}
        <input
          id={id}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="h-8 w-10 cursor-pointer rounded-lg border border-line/15 bg-transparent"
          aria-label={`${label}: custom color`}
        />
      </div>
    </div>
  );
}

export function Panel({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="rounded-2xl bg-surface/70 p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg">{title}</h2>
        {action}
      </div>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="text-sm text-muted-foreground">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="mt-1 min-h-11 w-full cursor-pointer rounded-xl border border-line/15 bg-bg/60 px-3 text-fg"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
