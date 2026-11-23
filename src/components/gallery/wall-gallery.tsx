"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useBag } from "@/components/bag/bag-context";
import { useSetLocale, useT } from "@/lib/i18n/client";
import { byCategory, formatSar, fromPrice, stockFor, type Product } from "@/lib/shop/catalog";
import { TAPESTRIES } from "@/lib/tapestry/designs";
import { drawHanging } from "@/lib/tapestry/render";
import { tokenHex } from "@/lib/theme-colors";
import { hasWebGL } from "@/lib/webgl";
import { useTapestryImage } from "@/components/shop/piece-image";
import { applyPose, buildRoom, lerpPose, nearestAngle, PY, R, RIN, STEP, type Pose, type Slot } from "./room";

type Mode = "walk" | "focus" | "gliding";

const GLIDE_MS = 950;

function smallScreen(): boolean {
  return window.matchMedia("(max-width: 819px), (orientation: portrait) and (max-width: 1100px), (orientation: landscape) and (max-height: 500px)").matches;
}
function portraitSmall(): boolean {
  return smallScreen() && window.innerHeight > window.innerWidth;
}

function walkPose(th: number): Pose {
  return portraitSmall() ? { th, r: 15.4, yaw: -0.42, y: 1.9, pitch: -0.1 } : { th, r: 15.6, yaw: -0.3, y: 1.92, pitch: -0.12 };
}
function walkOffset(): number {
  return portraitSmall() ? 0.14 + 0.9 * STEP : 0.14;
}
function focusPose(slot: Slot, th: number): Pose {
  const small = portraitSmall();
  const d = small ? 5.2 : 4.26;
  const y = PY - (small ? 1.05 : 0.52);
  return slot.wall === "outer" ? { th, r: R - d, yaw: Math.PI / 2, y, pitch: 0 } : { th, r: RIN + d, yaw: -Math.PI / 2, y, pitch: 0 };
}

/** The picture of a hanging: its photo, or drawn from its chart. */
function usePieceSrc(product: Product, cell: number): string | null {
  const drawn = useTapestryImage(product.tapestry, cell);
  return product.tapestry ? drawn : (product.photos[0]?.src ?? null);
}

/** One hanging's page, opened over the gallery. */
function PiecePanel({ product, onClose, onOpen, imageRef, detailsShown }: { product: Product; onClose: () => void; onOpen: (p: Product) => void; imageRef: (el: HTMLDivElement | null) => void; detailsShown: boolean }) {
  const { t, bi, locale } = useT();
  const { add } = useBag();
  const [sizeId, setSizeId] = useState(product.sizes[0].id);
  const [qty, setQty] = useState(1);
  const src = usePieceSrc(product, 14);
  const size = product.sizes.find((s) => s.id === sizeId) ?? product.sizes[0];
  const left = stockFor(product, product.colors[0].id, sizeId);
  const rest = byCategory("wall").filter((p) => p.slug !== product.slug);
  const start = Math.max(0, rest.findIndex(() => true));
  const collection = [product, ...rest.slice(start, start + 3)];

  return (
    <motion.section
      key={product.slug}
      className="fixed inset-0 z-[45] overflow-y-auto bg-bg"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      aria-label={bi(product.title)}
    >
      <div className="mx-auto grid max-w-6xl gap-10 px-5 pb-10 pt-24 md:grid-cols-[1fr_1fr] md:gap-14">
        <div className="md:sticky md:top-24 md:self-start">
          <div ref={imageRef} className="mx-auto aspect-[3/4.2] w-full max-w-[420px] rounded-sm bg-surface p-[6%] shadow-[0_2px_30px_rgba(0,0,0,0.12)]">
            {src && (
              // eslint-disable-next-line @next/next/no-img-element -- drawn from the stitch chart
              <img src={src} alt={bi(product.title)} className={`h-full w-full object-contain transition-opacity duration-150 ${detailsShown ? "opacity-100" : "opacity-0"}`} />
            )}
          </div>
        </div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: detailsShown ? 1 : 0 }} transition={{ duration: 0.15 }} className="space-y-6">
          <div>
            <h1 className="text-4xl sm:text-5xl">{bi(product.title)}</h1>
            <p className="mt-2 text-lg text-muted-foreground">{t.common.by(bi(product.maker))}</p>
          </div>
          <p className="leading-relaxed text-muted-foreground">{bi(product.description)}</p>
          <p className="text-2xl tabular-nums">{formatSar(size.price, locale)}</p>
          <div>
            <p className="text-sm text-muted-foreground">
              {t.common.size}: <span className="text-fg">{bi(size.label)}</span>
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {product.sizes.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={s.id === sizeId}
                  onClick={() => setSizeId(s.id)}
                  className={`min-h-10 rounded-lg border px-4 text-sm ${s.id === sizeId ? "border-fg bg-primary/25" : "border-line/25 hover:border-line/60"}`}
                >
                  {bi(s.label)}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex h-12 items-center rounded-lg border border-line/25">
              <button type="button" aria-label={t.bag.fewer} onClick={() => setQty((q) => Math.max(1, q - 1))} className="h-12 w-11">
                −
              </button>
              <span className="w-8 text-center tabular-nums">{qty}</span>
              <button type="button" aria-label={t.bag.more} onClick={() => setQty((q) => Math.min(Math.max(1, left), q + 1))} className="h-12 w-11">
                +
              </button>
            </div>
            <button type="button" disabled={left === 0} onClick={() => add({ slug: product.slug, color: product.colors[0].id, size: sizeId }, qty)} className="h-12 flex-1 rounded-lg bg-primary font-medium text-primary-fg hover:opacity-90 disabled:opacity-40">
              {t.common.addToBag}
            </button>
          </div>
          <ul className="space-y-1 border-t border-line/20 pt-4 text-[15px] text-muted-foreground">
            {product.details.map((d) => (
              <li key={d.en}>{bi(d)}</li>
            ))}
            {product.tapestry && <li>{t.product.chartLine(TAPESTRIES[product.tapestry].width, TAPESTRIES[product.tapestry].height, TAPESTRIES[product.tapestry].palette.length)}</li>}
          </ul>
          <div className="flex flex-wrap gap-4 text-sm">
            <Link href={`/shop/${product.slug}`} className="underline underline-offset-4">
              {t.common.view}
            </Link>
            <button type="button" onClick={onClose} className="underline underline-offset-4">
              {t.gallery.galleryTab}
            </button>
          </div>
        </motion.div>
      </div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: detailsShown ? 1 : 0 }} className="border-t border-line/10 bg-surface/50 px-5 py-12">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl">{t.product.more}</h2>
          <ul className="mt-8 flex gap-8 overflow-x-auto pb-2">
            {collection.slice(1).map((p) => (
              <li key={p.slug} className="w-40 shrink-0">
                <CollectionCard product={p} onOpen={onOpen} />
              </li>
            ))}
          </ul>
        </div>
      </motion.div>
    </motion.section>
  );
}

function CollectionCard({ product, onOpen }: { product: Product; onOpen: (p: Product) => void }) {
  const { bi, locale } = useT();
  const src = usePieceSrc(product, 8);
  return (
    <button type="button" onClick={() => onOpen(product)} className="group block w-full text-start">
      <div className="aspect-[3/4.2] rounded-sm bg-surface p-[6%] transition-transform duration-300 group-hover:-translate-y-1">
        {src && (
          // eslint-disable-next-line @next/next/no-img-element -- drawn from the stitch chart
          <img src={src} alt="" className="h-full w-full object-contain" />
        )}
      </div>
      <p className="mt-2 font-medium">{bi(product.title)}</p>
      <p className="text-sm text-muted-foreground">{bi(product.maker)}</p>
      <p className="text-sm tabular-nums">{formatSar(fromPrice(product), locale)}</p>
    </button>
  );
}

/** The 3D curved gallery of wall hangings. Scroll or drag to walk; click to look closer; click again to open. */
export function WallGallery() {
  const { t, bi, locale } = useT();
  const setLocale = useSetLocale();
  const { setOpen: setBagOpen } = useBag();
  const reduce = useReducedMotion() ?? false;
  const products = byCategory("wall");
  const host = useRef<HTMLDivElement>(null);
  const pill = useRef<HTMLDivElement>(null);
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const [mode, setMode] = useState<Mode>("walk");
  const [view, setView] = useState<"gallery" | "list">("gallery");
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const [detailsShown, setDetailsShown] = useState(false);
  const [ready, setReady] = useState(false);
  const api = useRef<{ step: (d: 1 | -1) => void; back: () => void; focusIndex: (i: number) => void; rectOf: (i: number) => DOMRect | null; lastIndex: number } | null>(null);
  const panelImage = useRef<HTMLDivElement | null>(null);
  const openRef = useRef<string | null>(null);
  openRef.current = openSlug;

  useEffect(() => setWebgl(hasWebGL()), []);
  useEffect(() => {
    if (webgl === false) setView("list");
  }, [webgl]);

  // Build the room once WebGL and fonts are ready.
  useEffect(() => {
    if (!webgl || !host.current) return;
    const el = host.current;
    let disposed = false;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.domElement.style.opacity = "0";
    renderer.domElement.style.transition = "opacity 900ms ease-out";
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(56, 1, 0.05, 100);
    let room: ReturnType<typeof buildRoom> | null = null;

    const resize = () => {
      const w = el.clientWidth || window.innerWidth;
      const h = el.clientHeight || window.innerHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.fov = w >= h ? 56 : 70;
      camera.updateProjectionMatrix();
    };
    resize();
    window.addEventListener("resize", resize);
    // The host can be laid out after this effect (fonts, overlays), so follow its real size.
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    const D = walkOffset();
    let th = 0 + D;
    let target = th;
    let pose: Pose = walkPose(th);
    let glide: { from: Pose; to: Pose; start: number; ms: number; intro?: boolean; done?: () => void } | null = null;
    let focused: Slot | null = null;
    let current: Mode = "walk";
    const setM = (m: Mode) => {
      current = m;
      setMode(m);
    };

    const startGlide = (to: Pose, done?: () => void, intro = false, ms = GLIDE_MS) => {
      glide = { from: { ...pose }, to, start: performance.now(), ms: reduce ? 0 : ms, intro, done };
      setM("gliding");
    };

    const focusSlot = (slot: Slot) => {
      focused = slot;
      const a = nearestAngle(slot.angle, pose.th);
      startGlide(focusPose(slot, a), () => setM("focus"));
    };
    const back = () => {
      if (current === "walk") return;
      focused = null;
      th = pose.th + walkOffset();
      target = th;
      startGlide(walkPose(th), () => setM("walk"));
    };
    const step = (d: 1 | -1) => {
      if (current !== "walk") return back();
      // forward is th decreasing
      target = (Math.round((target - D) / STEP) - d) * STEP + D;
    };

    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const pick = (cx: number, cy: number): Slot | null => {
      if (!room) return null;
      const r = el.getBoundingClientRect();
      ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObjects(room.slots.map((s) => s.mesh));
      return hits.length ? (room.slots.find((s) => s.mesh === hits[0].object) ?? null) : null;
    };

    const rectOfSlot = (slot: Slot): DOMRect => {
      const r = el.getBoundingClientRect();
      const box = new THREE.Box3().setFromObject(slot.mesh);
      const pts = [
        new THREE.Vector3(box.min.x, box.min.y, box.min.z),
        new THREE.Vector3(box.max.x, box.max.y, box.max.z),
        new THREE.Vector3(box.min.x, box.max.y, box.min.z),
        new THREE.Vector3(box.max.x, box.min.y, box.max.z),
      ].map((p) => p.project(camera));
      const xs = pts.map((p) => r.left + ((p.x + 1) / 2) * r.width);
      const ys = pts.map((p) => r.top + ((1 - p.y) / 2) * r.height);
      return new DOMRect(Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
    };

    // Input: wheel and drag walk; a click without dragging picks a hanging.
    let down: { x: number; y: number; th: number; moved: boolean } | null = null;
    const onWheel = (e: WheelEvent) => {
      if (openRef.current) return;
      e.preventDefault();
      if (current !== "walk") return back();
      const dy = e.deltaMode === 1 ? e.deltaY * 33 : e.deltaY;
      target += -dy * 0.0016;
    };
    const onDown = (e: PointerEvent) => {
      down = { x: e.clientX, y: e.clientY, th: target, moved: false };
      el.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (down) {
        const dx = e.clientX - down.x;
        const dy = e.clientY - down.y;
        if (!down.moved && Math.hypot(dx, dy) > 6) {
          down.moved = true;
          if (current !== "walk") back();
          el.style.cursor = "grabbing";
        }
        if (down.moved && current === "walk") {
          const k = smallScreen() ? 0.0042 : 0.0022;
          target = down.th + (Math.abs(dx) > Math.abs(dy) ? dx : dy) * k;
        }
        return;
      }
      const slot = pick(e.clientX, e.clientY);
      const overFocused = current === "focus" && slot !== null && slot === focused;
      el.style.cursor = slot ? "pointer" : "grab";
      if (pill.current) {
        pill.current.style.opacity = overFocused && !smallScreen() ? "1" : "0";
        pill.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
      }
    };
    const onUp = (e: PointerEvent) => {
      const d = down;
      down = null;
      el.style.cursor = "grab";
      if (!d || d.moved) return;
      const slot = pick(e.clientX, e.clientY);
      if (!slot) return back();
      if (current === "focus" && slot === focused) {
        openPiece(slot.index, rectOfSlot(slot));
        return;
      }
      focusSlot(slot);
    };
    const onKey = (e: KeyboardEvent) => {
      if (openRef.current) return;
      if (e.key === "Escape") back();
      if (e.key === "ArrowRight" || e.key === "ArrowDown") step(1);
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") step(-1);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    window.addEventListener("keydown", onKey);

    // Opening: a copy of the hanging flies from the wall into the page's image box.
    const openPiece = (index: number, from: DOMRect) => {
      const product = products[index];
      if (!product || !room) return;
      api.current!.lastIndex = index;
      setDetailsShown(false);
      setOpenSlug(product.slug);
      let flySrc = product.photos[0]?.src ?? "";
      if (product.tapestry) {
        const canvas = document.createElement("canvas");
        const d = TAPESTRIES[product.tapestry];
        drawHanging(canvas, d.grid, d.palette.map((p) => p.hex), { cell: 10, fringe: true, dowel: true });
        flySrc = canvas.toDataURL();
      }
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          const box = panelImage.current?.getBoundingClientRect();
          if (!box || reduce) {
            setDetailsShown(true);
            return;
          }
          const inner = new DOMRect(box.left + box.width * 0.06, box.top + box.height * 0.06, box.width * 0.88, box.height * 0.88);
          const fly = document.createElement("img");
          fly.src = flySrc;
          fly.alt = "";
          Object.assign(fly.style, { position: "fixed", left: `${from.left}px`, top: `${from.top}px`, width: `${from.width}px`, height: `${from.height}px`, objectFit: "contain", zIndex: "46", pointerEvents: "none" });
          document.body.appendChild(fly);
          const sx = inner.width / from.width;
          const sy = inner.height / from.height;
          const s = Math.min(sx, sy);
          const tx = inner.left + inner.width / 2 - (from.left + from.width / 2);
          const ty = inner.top + inner.height / 2 - (from.top + from.height / 2);
          fly.animate([{ transform: "translate(0,0) scale(1)" }, { transform: `translate(${tx}px, ${ty}px) scale(${s})` }], { duration: 300, easing: "cubic-bezier(.25,.75,.25,1)", fill: "forwards" }).onfinish = () => {
            setDetailsShown(true);
            window.setTimeout(() => fly.remove(), 160);
          };
        }),
      );
    };

    api.current = {
      step,
      back,
      focusIndex: (i: number) => {
        if (!room) return;
        const candidates = room.slots.filter((s) => s.wall === "outer" && s.index === i);
        const best = candidates.reduce((a, b) => (Math.abs(nearestAngle(a.angle, pose.th) - pose.th) <= Math.abs(nearestAngle(b.angle, pose.th) - pose.th) ? a : b));
        focusSlot(best);
      },
      rectOf: () => null,
      lastIndex: 0,
    };

    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (glide) {
        const t = glide.ms === 0 ? 1 : Math.min(1, (now - glide.start) / glide.ms);
        pose = lerpPose(glide.from, glide.to, t, glide.intro);
        if (t >= 1) {
          const done = glide.done;
          glide = null;
          th = pose.th;
          target = th;
          done?.();
        }
      } else if (current === "walk") {
        th = reduce ? target : th + (target - th) * (1 - Math.exp(-dt / 0.36));
        pose = { ...walkPose(th) };
      }
      applyPose(camera, pose);
      if (!openRef.current) renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };

    (async () => {
      await document.fonts.ready;
      if (disposed) return;
      const ink = tokenHex("fg");
      const pieces = await Promise.all(
        products.map(async (p) => {
          let image: HTMLCanvasElement | HTMLImageElement;
          if (p.tapestry) {
            const d = TAPESTRIES[p.tapestry];
            image = document.createElement("canvas");
            drawHanging(image, d.grid, d.palette.map((x) => x.hex), { cell: 16, fringe: true, dowel: true });
          } else {
            image = new Image();
            image.src = p.photos[0].src;
            await image.decode().catch(() => undefined);
          }
          return { image, maker: bi(p.maker), title: bi(p.title), meta: `${formatSar(fromPrice(p), locale)}` };
        }),
      );
      if (disposed) return;
      const bg = tokenHex("bg");
      const s1 = tokenHex("surface");
      const s2 = tokenHex("surface-2");
      room = buildRoom(scene, { wallTop: s2, wallMid: s1, wallBottom: s2, floorIn: s2, floorOut: s1, ceiling: s1, fog: bg, ink }, pieces, locale === "ar", renderer.capabilities.getMaxAnisotropy());
      // Entrance: a gentle step forward into the passage.
      pose = { ...walkPose(th + 0.16), r: walkPose(th).r - 0.35 };
      startGlide(walkPose(th), () => setM("walk"), true, 1400);
      renderer.domElement.style.opacity = "1";
      setReady(true);
      raf = requestAnimationFrame(loop);
    })();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      ro.disconnect();
      window.removeEventListener("keydown", onKey);
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      room?.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
    // Rebuild when the language changes (labels) — products and texts are stable otherwise.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [webgl, locale, reduce]);

  const closePanel = useCallback(() => {
    const idx = api.current?.lastIndex ?? 0;
    setOpenSlug(null);
    setView("gallery");
    window.setTimeout(() => api.current?.focusIndex(idx), 320);
  }, []);

  useEffect(() => {
    if (!openSlug) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closePanel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openSlug, closePanel]);

  const openFromList = (p: Product) => {
    if (api.current) api.current.lastIndex = products.indexOf(p);
    setOpenSlug(p.slug);
    setDetailsShown(reduce);
    window.setTimeout(() => setDetailsShown(true), reduce ? 0 : 300);
    window.scrollTo({ top: 0 });
  };

  const product = products.find((p) => p.slug === openSlug) ?? null;
  const focusMode = mode === "focus" || mode === "gliding";
  const line = (text: string, i: number) => (
    <span className="block overflow-hidden">
      <motion.span className="block" initial={{ y: "105%" }} animate={ready || webgl === false ? { y: 0 } : {}} transition={{ duration: reduce ? 0 : 1, delay: reduce ? 0 : 0.25 + i * 0.06, ease: [0.2, 0.7, 0.2, 1] }}>
        {text}
      </motion.span>
    </span>
  );

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ touchAction: "none" }}>
      {/* Header for the gallery */}
      <header className={`fixed inset-x-0 top-0 z-[50] flex h-14 items-center justify-between px-4 transition-colors sm:px-6 ${openSlug || view === "list" ? "border-b border-line/15 bg-bg" : ""}`}>
        <Link href="/shop" className="flex items-center gap-2 text-[15px]">
          <svg viewBox="0 0 20 20" className="h-4 w-4 rtl:-scale-x-100" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <path d="M16 10H4M9 5l-5 5 5 5" />
          </svg>
          <span className="font-serif text-lg font-bold">{t.site.name}</span>
          <span className="text-muted-foreground">/ {t.nav.store}</span>
        </Link>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setLocale(locale === "ar" ? "en" : "ar")} className="min-h-10 rounded-lg px-3 text-sm hover:bg-surface-2" aria-label={t.nav.langLabel}>
            {t.nav.lang}
          </button>
          <button type="button" onClick={() => setBagOpen(true)} className="min-h-10 rounded-lg px-3 text-sm hover:bg-surface-2">
            {t.nav.bag}
          </button>
        </div>
      </header>

      <main id="main" className="absolute inset-0">
        <div ref={host} className="absolute inset-0 cursor-grab" aria-label={t.gallery.headline} role="img" />

        {/* Gallery UI */}
        <div className={`pointer-events-none absolute inset-0 z-20 transition-opacity duration-300 ${openSlug || view === "list" ? "invisible opacity-0" : "opacity-100"}`}>
          <div className="pointer-events-auto absolute start-4 top-1/3 hidden flex-col gap-2.5 sm:flex">
            {([-1, 1] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => api.current?.step(d)}
                aria-label={d === 1 ? t.common.next : t.common.prev}
                className="flex h-12 w-12 items-center justify-center rounded-sm border-[1.5px] border-fg text-fg transition-colors hover:bg-fg hover:text-bg"
              >
                <svg viewBox="0 0 20 20" className={`h-5 w-5 ${d === -1 ? "" : "rotate-180"}`} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                  <path d="M16 10H4M9 5l-5 5 5 5" />
                </svg>
              </button>
            ))}
          </div>
          <p className="absolute end-4 top-16 text-end text-xs leading-relaxed text-muted-foreground sm:bottom-48 sm:top-auto sm:text-sm">
            {line(focusMode ? t.gallery.focus1 : t.gallery.hint1, 0)}
            {line(focusMode ? t.gallery.focus2 : t.gallery.hint2, 1)}
          </p>
          <div className="absolute bottom-6 start-4 sm:bottom-8 sm:start-6">
            <p className="text-sm text-muted-foreground">{line(t.gallery.kicker, 2)}</p>
            <h1 className="mt-1 text-[min(17vw,9rem)] font-extrabold leading-[0.9]">{line(t.gallery.headline, 3)}</h1>
            <button type="button" onClick={() => setView("list")} className="pointer-events-auto mt-3 border-b border-fg pb-0.5 text-sm">
              {line(t.gallery.enter, 4)}
            </button>
          </div>
        </div>

        {/* Gallery / List toggle */}
        <div className="absolute bottom-6 end-4 z-[48] flex rounded-full border border-line/30 bg-bg/70 p-0.5 text-xs backdrop-blur sm:bottom-8 sm:end-6">
          {(["gallery", "list"] as const).map((v) => (
            <button
              key={v}
              type="button"
              disabled={v === "gallery" && webgl === false}
              onClick={() => {
                if (v === "gallery") closePanel();
                else {
                  setOpenSlug(null);
                  setView("list");
                }
              }}
              aria-pressed={view === v && !openSlug}
              className={`min-h-8 rounded-sm px-4 ${view === v && !openSlug ? "bg-fg text-bg" : ""}`}
            >
              {v === "gallery" ? t.gallery.galleryTab : t.gallery.listTab}
            </button>
          ))}
        </div>

        <div ref={pill} aria-hidden="true" className="pointer-events-none fixed left-0 top-0 z-30 rounded-sm bg-ink px-3 py-1.5 text-xs text-white opacity-0 transition-opacity duration-100" style={{ backgroundColor: "#1e1b2b" }}>
          {t.gallery.pill}
        </div>

        {/* List view */}
        <AnimatePresence>
          {view === "list" && !openSlug && (
            <motion.section className="fixed inset-0 z-[44] overflow-y-auto bg-bg px-5 pb-24 pt-24 sm:px-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              {webgl === false && <p className="mb-6 text-sm text-muted-foreground">{t.gallery.noWebgl}</p>}
              <h2 className="text-4xl sm:text-5xl">{t.gallery.allTitle}</h2>
              <ul className="mt-10 grid grid-cols-2 gap-x-8 gap-y-12 sm:grid-cols-3 lg:grid-cols-5">
                {products.map((p) => (
                  <li key={p.slug}>
                    <CollectionCard product={p} onOpen={openFromList} />
                  </li>
                ))}
              </ul>
            </motion.section>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {product && (
            <PiecePanel
              product={product}
              onClose={closePanel}
              onOpen={openFromList}
              detailsShown={detailsShown}
              imageRef={(el) => {
                panelImage.current = el;
              }}
            />
          )}
        </AnimatePresence>
        {product && <span className="sr-only" aria-live="polite">{bi(product.title)}</span>}
      </main>
    </div>
  );
}
