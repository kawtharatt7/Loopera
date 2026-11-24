"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useC, YARN_HEX, type CollectionDict } from "@/lib/i18n/collection";
import { useLocale } from "@/lib/i18n/client";
import { formatSar } from "@/lib/shop/catalog";
import { bouquetPrice, saveRequest, type CustomRequest } from "@/lib/shop/requests";
import { whatsappLink } from "@/lib/shop/whatsapp";

export type CustomKind = CustomRequest["kind"];
type Yarn = keyof CollectionDict["yarns"];
const YARNS = Object.keys(YARN_HEX) as Yarn[];

/** A panel that slides in from the reading end of the page (right in English, left in Arabic). */
export function Drawer({ open, onClose, title, children, wide = false }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  const c = useC();
  const reduce = useReducedMotion() ?? false;
  const rtl = useLocale() === "ar";
  const panel = useRef<HTMLDivElement | null>(null);
  const titleId = useId();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => panel.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus());
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      opener?.focus?.();
    };
  }, [open, onClose]);

  if (!mounted) return null;
  const from = rtl ? "-100%" : "100%";
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-labelledby={titleId}>
          <motion.button
            type="button"
            tabIndex={-1}
            aria-label={c.close}
            onClick={onClose}
            className="absolute inset-0 bg-[rgb(38_33_30/0.45)] backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            ref={panel}
            className={`absolute inset-y-0 end-0 flex w-full flex-col bg-bg shadow-[0_0_80px_rgba(0,0,0,0.25)] ${wide ? "max-w-2xl" : "max-w-lg"}`}
            initial={reduce ? { opacity: 0 } : { x: from }}
            animate={reduce ? { opacity: 1 } : { x: 0 }}
            exit={reduce ? { opacity: 0 } : { x: from }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center justify-between border-b border-line/10 px-6 py-4">
              <h2 id={titleId} className="text-xl">
                {title}
              </h2>
              <button type="button" data-autofocus onClick={onClose} className="inline-flex h-11 items-center gap-2 rounded-sm px-3 text-sm hover:bg-surface">
                {c.close}
                <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                  <path d="M3 3l10 10M13 3L3 13" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function Chips<T extends string>({ legend, options, value, onChange, multi = false }: { legend: string; options: [T, string][]; value: T[]; onChange: (v: T[]) => void; multi?: boolean }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm text-muted-foreground">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map(([id, label]) => {
          const on = value.includes(id);
          return (
            <button
              key={id}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(multi ? (on ? value.filter((v) => v !== id) : [...value, id]) : [id])}
              className={`min-h-11 rounded-sm border px-4 text-sm transition-colors ${on ? "border-fg bg-fg text-bg" : "border-line/25 hover:border-fg"}`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function YarnPicker({ legend, value, onChange, max = 6, single = false }: { legend: string; value: Yarn[]; onChange: (v: Yarn[]) => void; max?: number; single?: boolean }) {
  const c = useC();
  return (
    <fieldset>
      <legend className="mb-2 text-sm text-muted-foreground">
        {legend}
        {value.length > 0 && <span className="text-fg">: {value.map((y) => c.yarns[y]).join("، ")}</span>}
      </legend>
      <div className="flex flex-wrap gap-2">
        {YARNS.map((y) => {
          const on = value.includes(y);
          return (
            <button
              key={y}
              type="button"
              aria-pressed={on}
              aria-label={c.yarns[y]}
              title={c.yarns[y]}
              onClick={() => onChange(single ? [y] : on ? value.filter((v) => v !== y) : value.length >= max ? value : [...value, y])}
              className={`h-10 w-10 rounded-full border-2 p-0.5 transition-colors ${on ? "border-fg" : "border-transparent hover:border-line/50"}`}
            >
              <span className="block h-full w-full rounded-full ring-1 ring-line/20" style={{ background: YARN_HEX[y] }} />
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

const input = "min-h-12 w-full rounded-sm border border-line/25 bg-paper px-3 text-paper-fg placeholder:text-paper-fg/45 focus:border-fg";

/**
 * The custom-order form, in four flavours: a general request ("I can crochet"), a wall hanging,
 * a doll, or a bouquet. It saves the request with a reference; the maker confirms before making.
 */
export function CustomOrderForm({ kind, preset = "", onDone }: { kind: CustomKind; preset?: string; onDone?: () => void }) {
  const c = useC();
  const f = c.form;
  const locale = useLocale();
  const [what, setWhat] = useState<(keyof typeof f.kinds)[]>(["clothes"]);
  const [wallType, setWallType] = useState<(keyof typeof f.wallTypes)[]>([presetType(preset)]);
  const [subject, setSubject] = useState(preset.includes(":") ? preset.slice(preset.indexOf(":") + 1) : "");
  const [wallSize, setWallSize] = useState<("30x20" | "45x30" | "60x45")[]>(["30x20"]);
  const [dollStyle, setDollStyle] = useState<(keyof typeof f.dollStyles)[]>([preset === "graduation" ? "graduation" : "anime"]);
  const [sash, setSash] = useState<Yarn[]>(["yellow"]);
  const [hair, setHair] = useState<Yarn[]>(["brown"]);
  const [skin, setSkin] = useState<Yarn[]>(["oatmeal"]);
  const [outfit, setOutfit] = useState<Yarn[]>(["black"]);
  const [nameTag, setNameTag] = useState("");
  const [flowers, setFlowers] = useState<(keyof typeof f.flowerTypes)[]>(["roses"]);
  const [stems, setStems] = useState<("3" | "6" | "12")[]>(["6"]);
  const [wrap, setWrap] = useState<(keyof typeof f.wraps)[]>(["kraft"]);
  const [card, setCard] = useState("");
  const [yarns, setYarns] = useState<Yarn[]>([]);
  const [note, setNote] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [picture, setPicture] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [sent, setSent] = useState<CustomRequest | null>(null);

  useEffect(() => () => void (picture && URL.revokeObjectURL(picture)), [picture]);

  const estimate =
    kind === "bouquet" ? bouquetPrice(Number(stems[0])) : kind === "wall" ? ({ "30x20": 150, "45x30": 190, "60x45": 260 } as const)[wallSize[0]] : kind === "doll" ? (dollStyle[0] === "minime" ? 260 : 220) : null;

  const submit = () => {
    if (!name.trim() || phone.replace(/\D/g, "").length < 6) return setError(f.required);
    const subj = kind === "general" ? f.kinds[what[0]] : kind === "wall" ? subject.trim() || f.wallTypes[wallType[0]] : kind === "doll" ? f.dollStyles[dollStyle[0]] : flowers.map((x) => f.flowerTypes[x]).join(", ");
    if (kind === "general" && !note.trim()) return setError(f.describe);
    const choices: Record<string, string> = {};
    if (kind === "wall") Object.assign(choices, { type: wallType[0], subject: subject.trim(), size: wallSize[0] });
    if (kind === "doll") Object.assign(choices, { style: dollStyle[0], sash: sash[0], hair: hair[0], skin: skin[0], outfit: outfit[0], nameTag: nameTag.trim(), subject: preset });
    if (kind === "bouquet") Object.assign(choices, { flowers: flowers.join(","), stems: stems[0], wrap: wrap[0], card: card.trim() });
    if (kind === "general") Object.assign(choices, { kind: what[0] });
    setSent(saveRequest({ kind, subject: subj.slice(0, 120), choices, colors: yarns, note: note.trim(), name: name.trim(), phone: phone.trim(), estimate, hasPicture: !!picture }));
  };

  if (sent)
    return (
      <div className="py-10 text-center">
        <p className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sage/15 text-sage">
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12.5l4.2 4.2L19 7" />
          </svg>
        </p>
        <h3 className="mt-5 text-2xl">{f.sentTitle}</h3>
        <p className="mx-auto mt-3 max-w-sm leading-relaxed text-muted-foreground">{f.sentText(sent.ref)}</p>
        <a
          href={whatsappLink(c.waRequest(sent.ref, [sent.subject, ...Object.entries(sent.choices).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`), sent.colors.length ? `yarn: ${sent.colors.join(", ")}` : "", sent.note, `${sent.name} · ${sent.phone}`].filter(Boolean).join("\n")))}
          target="_blank"
          rel="noopener noreferrer"
          className="stitch mt-6 inline-flex min-h-12 items-center gap-2 rounded-sm bg-[#1F7A4D] px-7 font-medium text-white hover:opacity-90"
        >
          <WhatsAppIcon />
          {c.whatsapp}
        </a>
        {onDone && (
          <button type="button" onClick={onDone} className="mt-4 ms-3 inline-flex min-h-12 items-center rounded-sm border border-fg/30 px-7 hover:border-fg">
            {c.close}
          </button>
        )}
      </div>
    );

  return (
    <form
      className="flex flex-col gap-7"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      noValidate
    >
      {kind === "general" && (
        <>
          <p className="leading-relaxed text-muted-foreground">{f.generalSub}</p>
          <Chips legend={f.whatKind} options={Object.entries(f.kinds) as [keyof typeof f.kinds, string][]} value={what} onChange={setWhat} />
        </>
      )}

      {kind === "wall" && (
        <>
          <Chips legend={f.wallType} options={Object.entries(f.wallTypes) as [keyof typeof f.wallTypes, string][]} value={wallType} onChange={setWallType} />
          <Field label={f.subject}>
            <input className={input} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={f.subjectPh} maxLength={100} />
          </Field>
          <Chips legend={f.wallSize} options={[["30x20", locale === "ar" ? "٣٠ × ٢٠ سم" : "30 × 20 cm"], ["45x30", locale === "ar" ? "٤٥ × ٣٠ سم" : "45 × 30 cm"], ["60x45", locale === "ar" ? "٦٠ × ٤٥ سم" : "60 × 45 cm"]]} value={wallSize} onChange={setWallSize} />
        </>
      )}

      {kind === "doll" && (
        <>
          <Chips legend={f.dollStyle} options={Object.entries(f.dollStyles) as [keyof typeof f.dollStyles, string][]} value={dollStyle} onChange={setDollStyle} />
          {dollStyle[0] === "graduation" && <YarnPicker legend={f.sash} value={sash} onChange={setSash} single />}
          <YarnPicker legend={f.hair} value={hair} onChange={setHair} single />
          <YarnPicker legend={f.skin} value={skin} onChange={setSkin} single />
          <YarnPicker legend={f.outfit} value={outfit} onChange={setOutfit} single />
          <Field label={f.nameTag}>
            <input className={input} value={nameTag} onChange={(e) => setNameTag(e.target.value)} maxLength={30} />
          </Field>
        </>
      )}

      {kind === "bouquet" && (
        <>
          <Chips legend={f.flowers} options={Object.entries(f.flowerTypes) as [keyof typeof f.flowerTypes, string][]} value={flowers} onChange={(v) => setFlowers(v.length ? v : flowers)} multi />
          <Chips legend={f.stems} options={[["3", "3"], ["6", "6"], ["12", "12"]]} value={stems} onChange={setStems} />
          <Chips legend={f.wrap} options={Object.entries(f.wraps) as [keyof typeof f.wraps, string][]} value={wrap} onChange={setWrap} />
          <Field label={f.card}>
            <textarea className={`${input} min-h-24 py-3`} value={card} onChange={(e) => setCard(e.target.value)} maxLength={240} />
          </Field>
        </>
      )}

      {(kind === "wall" || kind === "general") && <YarnPicker legend={f.yarn} value={yarns} onChange={setYarns} />}

      {kind !== "bouquet" && (
        <div>
          <span className="mb-2 block text-sm text-muted-foreground">{f.picture}</span>
          <label className="flex min-h-24 cursor-pointer items-center gap-4 rounded-sm border border-dashed border-line/30 p-3 hover:border-fg">
            {picture ? (
              // eslint-disable-next-line @next/next/no-img-element -- local preview of the visitor's own file
              <img src={picture} alt="" className="h-20 w-20 rounded-sm object-cover" />
            ) : (
              <span aria-hidden="true" className="flex h-20 w-20 items-center justify-center rounded-sm bg-surface text-2xl text-muted-foreground">
                +
              </span>
            )}
            <span className="text-sm text-muted-foreground">{f.pictureNote}</span>
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setPicture(URL.createObjectURL(file));
              }}
            />
          </label>
        </div>
      )}

      <Field label={f.note}>
        <textarea className={`${input} min-h-24 py-3`} value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={f.name}>
          <input className={input} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={80} />
        </Field>
        <Field label={f.phone}>
          <input className={input} value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" dir="ltr" maxLength={30} />
        </Field>
      </div>

      {error && (
        <p role="alert" className="text-sm text-ember">
          {error}
        </p>
      )}
      <div className="sticky bottom-0 -mx-6 flex items-center justify-between gap-4 border-t border-line/10 bg-bg px-6 py-4">
        <span className="text-sm text-muted-foreground">
          {estimate !== null && (
            <>
              {f.estimate}: <span className="text-lg tabular-nums text-fg">{formatSar(estimate, locale)}</span>
            </>
          )}
        </span>
        <button type="submit" className="min-h-12 rounded-sm bg-primary px-7 font-medium text-primary-fg hover:opacity-90">
          {f.send}
        </button>
      </div>
    </form>
  );
}

function presetType(preset: string): "crest" | "flag" | "city" | "character" | "calligraphy" {
  if (preset.startsWith("club:")) return "crest";
  if (preset.startsWith("char:")) return "character";
  if (preset.startsWith("flag:")) return "flag";
  if (preset.startsWith("orig:")) return "calligraphy";
  return preset ? "crest" : "calligraphy";
}

/** Opens the right form in a drawer. `preset` like "club:Al-Hilal" pre-fills the design. */
export function CustomOrderDrawer({ open, onClose, kind, preset = "" }: { open: boolean; onClose: () => void; kind: CustomKind; preset?: string }) {
  const c = useC();
  const title = kind === "general" ? c.form.general : kind === "wall" ? c.form.wall : kind === "doll" ? c.form.doll : c.form.bouquet;
  return (
    <Drawer open={open} onClose={onClose} title={title}>
      {/* key: a fresh form each time it opens */}
      {open && <CustomOrderForm key={`${kind}-${preset}`} kind={kind} preset={preset} onDone={onClose} />}
    </Drawer>
  );
}

export function WhatsAppIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.2-.2-.5-.3Z" />
    </svg>
  );
}
