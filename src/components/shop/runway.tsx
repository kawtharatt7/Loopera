"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useBag } from "@/components/bag/bag-context";
import { useT } from "@/lib/i18n/client";
import { formatSar, type Product } from "@/lib/shop/catalog";
import { useRecolored } from "@/lib/shop/recolor";
import { optimizedSrc } from "@/lib/shop/image";

/*
  Runway depth line (after the "Maison Vell" lookbook): the looks stand in one line that recedes
  into a blurred distance. Dragging, the arrows or the keyboard walk the line forward; the front
  look leaves past the product column and the next one steps up. One number, p, drives everything.
  Depth is read from a table of stops (d = -1 … 5) and interpolated; layers only scale.
*/
const KX = [1.2, 0.744, 0.496, 0.346, 0.235, 0.15, 0.085];
const KF = [1.14, 0.95, 0.83, 0.75, 0.69, 0.65, 0.62];
const KH = [1.18, 0.86, 0.6, 0.46, 0.355, 0.275, 0.2];
const KB = [0, 0, 1.5, 4, 8, 12, 17];
const KO = [1, 1, 1, 1, 0.86, 0.5, 0];
const RATIO = 3 / 4; // photo frame, width / height

const wrap = (x: number, n: number) => ((x % n) + n) % n;
const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

export function Runway({ products }: { products: Product[] }) {
  const { t, bi, locale } = useT();
  const { add } = useBag();
  const rtl = locale === "ar";
  const n = products.length;
  // At least six bodies on the line, so the one walking out never reappears at the back mid-way.
  const bodies = useMemo(() => Array.from({ length: n * Math.ceil(6 / n) }, (_, i) => i), [n]);
  const N = bodies.length;

  const stage = useRef<HTMLDivElement>(null);
  const els = useRef<(HTMLDivElement | null)[]>([]);
  const ring = useRef<HTMLDivElement>(null);
  const state = useRef({ p: 0, target: 0 });
  const [look, setLook] = useState(0);
  const [colorBy, setColorBy] = useState<Record<string, string>>({});
  const [sizeBy, setSizeBy] = useState<Record<string, string>>({});
  const [added, setAdded] = useState<string | null>(null);

  const go = (delta: number) => {
    state.current.target = Math.round(state.current.target) + delta;
  };
  const swatch = (prod: Product, hex: string) => (hex === "transparent" ? (prod.recolor?.from ?? "#999") : hex);

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let W = 0;
    let H = 0;
    let raf = 0;
    let last = 0;
    let dirty = true;
    let visible = true;
    const cache = bodies.map(() => ({ f: "", o: "" }));
    const s = state.current;

    const size = () => {
      W = el.clientWidth;
      H = el.clientHeight;
      const base = H * 1.2;
      els.current.forEach((b) => {
        if (!b) return;
        b.style.height = `${base}px`;
        b.style.width = `${base * RATIO}px`;
      });
      dirty = true;
    };

    const paint = () => {
      const base = H * 1.2;
      els.current.forEach((b, i) => {
        if (!b) return;
        let d = wrap(i - s.p, N);
        if (d > N - 1) d -= N;
        const k = clamp(d + 1, 0, 6);
        const a = Math.floor(k);
        const c = Math.min(6, a + 1);
        const tt = k - a;
        const mix = (A: number[]) => A[a] + (A[c] - A[a]) * tt;
        const h = mix(KH) * H * (W < 640 ? 0.74 : 1);
        const sc = h / base;
        const w = h * RATIO;
        const cx = rtl ? 1 - mix(KX) : mix(KX);
        const x = cx * W - w / 2;
        const y = mix(KF) * H - h;
        b.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) scale(${sc.toFixed(4)})`;
        const blur = mix(KB) / sc;
        const fs = blur < 0.2 ? "none" : `blur(${blur.toFixed(1)}px)`;
        const o = mix(KO).toFixed(3);
        if (fs !== cache[i].f) b.style.filter = cache[i].f = fs;
        if (o !== cache[i].o) {
          b.style.opacity = cache[i].o = o;
          b.style.visibility = Number(o) < 0.01 ? "hidden" : "visible";
        }
        b.style.zIndex = String(100 - Math.round(d * 10));
      });
    };

    let mx = 0;
    let my = 0;
    let rx = 0;
    let ry = 0;
    const frame = (now: number) => {
      const dt = Math.min(50, now - last) || 16;
      last = now;
      const was = s.p;
      s.p = calm ? s.target : s.p + (s.target - s.p) * (1 - Math.exp(-dt * 0.0072));
      if (Math.abs(s.target - s.p) < 0.0004) s.p = s.target;
      if (s.p !== was || dirty) {
        dirty = false;
        paint();
        setLook(wrap(Math.round(s.p), n));
      }
      rx += (mx - rx) * 0.32;
      ry += (my - ry) * 0.32;
      if (ring.current) ring.current.style.transform = `translate3d(${rx.toFixed(1)}px,${ry.toFixed(1)}px,0)`;
      raf = visible ? requestAnimationFrame(frame) : 0;
    };

    // Drag is direct; release snaps to a whole look. A press that barely moves on a model jumps to it.
    let down = false;
    let sx = 0;
    let st = 0;
    let moved = 0;
    let wheelT = 0;
    const pull = () => Math.max(150, W * 0.2);
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      mx = e.clientX - r.left;
      my = e.clientY - r.top;
      if (!down) return;
      const dx = (e.clientX - sx) * (rtl ? -1 : 1);
      moved = Math.max(moved, Math.abs(dx));
      s.target = st + dx / pull();
    };
    const onDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest("a,button")) return;
      down = true;
      sx = e.clientX;
      st = s.target;
      moved = 0;
      el.setPointerCapture(e.pointerId);
      ring.current?.classList.add("is-drag");
    };
    const onUp = (e: PointerEvent) => {
      if (!down) return;
      down = false;
      ring.current?.classList.remove("is-drag");
      if (moved < 6) {
        const hit = document.elementsFromPoint(e.clientX, e.clientY).find((x) => x instanceof HTMLElement && x.dataset.body !== undefined) as HTMLElement | undefined;
        if (hit) {
          const d = Math.round(wrap(Number(hit.dataset.body) - s.target, N));
          if (d > 0 && d < N) s.target = Math.round(s.target) + d;
        }
      } else s.target = Math.round(s.target);
    };
    // Only sideways wheel turns the line, so the page still scrolls normally.
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      s.target += (clamp(e.deltaX, -120, 120) / 420) * (rtl ? -1 : 1);
      clearTimeout(wheelT);
      wheelT = window.setTimeout(() => (s.target = Math.round(s.target)), 150);
    };
    const onKey = (e: KeyboardEvent) => {
      const fwd = rtl ? "ArrowLeft" : "ArrowRight";
      const back = rtl ? "ArrowRight" : "ArrowLeft";
      if (e.key === fwd) {
        e.preventDefault();
        s.target = Math.round(s.target) + 1;
      } else if (e.key === back) {
        e.preventDefault();
        s.target = Math.round(s.target) - 1;
      }
    };
    const enter = (e: PointerEvent) => e.pointerType === "mouse" && ring.current?.classList.add("is-on");
    const leave = () => ring.current?.classList.remove("is-on");

    let idleUntil = 0;
    const touch = () => (idleUntil = performance.now() + 9000);
    const auto = window.setInterval(() => {
      if (calm || down || !visible || document.hidden || performance.now() < idleUntil) return;
      s.target = Math.round(s.target) + 1;
    }, 4500);
    el.addEventListener("pointerdown", touch);
    el.addEventListener("wheel", touch, { passive: true });
    el.addEventListener("keydown", touch);
    el.addEventListener("pointerenter", touch);
    const io = new IntersectionObserver(([en]) => {
      visible = en.isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(frame);
    });
    io.observe(el);
    const ro = new ResizeObserver(size);
    ro.observe(el);
    size();
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("pointerenter", enter);
    el.addEventListener("pointerleave", leave);
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("keydown", onKey);
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(wheelT);
      clearInterval(auto);
      el.removeEventListener("pointerdown", touch);
      el.removeEventListener("wheel", touch);
      el.removeEventListener("keydown", touch);
      el.removeEventListener("pointerenter", touch);
      io.disconnect();
      ro.disconnect();
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("pointerenter", enter);
      el.removeEventListener("pointerleave", leave);
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("keydown", onKey);
    };
  }, [bodies, N, n, rtl]);

  const p = products[look];
  const colorId = colorBy[p.slug] ?? p.colors[0].id;
  const sizeId = sizeBy[p.slug] ?? p.sizes[0].id;
  const price = p.sizes.find((x) => x.id === sizeId)?.price ?? p.sizes[0].price;
  const num = (i: number) => String(i + 1).padStart(2, "0");

  return (
    <div className="grid border-y border-line/15 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div
        ref={stage}
        tabIndex={0}
        role="region"
        aria-roledescription="carousel"
        aria-label={`${t.shop.clothesHeadline} ${t.shop.runwayHint}`}
        className="runway-stage relative isolate h-[min(66svh,560px)] min-h-[420px] sm:h-[min(78svh,760px)] sm:min-h-[460px] touch-pan-y select-none overflow-hidden bg-surface outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
      >
        {bodies.map((i) => {
          const prod = products[i % n];
          const hex = prod.colors.find((c) => c.id === colorBy[prod.slug])?.hex ?? null;
          return (
            <div
              key={i}
              ref={(e) => {
                els.current[i] = e;
              }}
              data-body={i}
              aria-hidden="true"
              className="absolute left-0 top-0 origin-top-left will-change-transform"
              style={{ opacity: 0 }}
            >
              <BodyPhoto product={prod} hex={hex} />
              <span className="absolute -bottom-[1.6%] left-[8%] right-[8%] h-[3.6%] rounded-[50%] bg-[radial-gradient(closest-side,rgba(0,0,0,.35),transparent)]" />
            </div>
          );
        })}

        <div className="pointer-events-none absolute bottom-6 start-6 z-[200] sm:bottom-8 sm:start-8">
          <p className="flex items-baseline gap-3 font-serif text-2xl leading-[38px] sm:text-[29px]" aria-live="polite">
            <span>{t.shop.look}</span>
            <span className="inline-block h-[38px] overflow-hidden tabular-nums">
              <span className="block transition-transform duration-500 ease-out" style={{ transform: `translateY(${-look * 38}px)` }}>
                {products.map((_, i) => (
                  <b key={i} className="block h-[38px] font-normal">
                    {num(i)}
                  </b>
                ))}
              </span>
            </span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{t.shop.runwayHint}</p>
        </div>

        <div ref={ring} aria-hidden="true" className="runway-ring pointer-events-none absolute left-0 top-0 z-[300] hidden lg:block" />
      </div>

      <aside aria-label={bi(p.title)} className="flex flex-col gap-5 border-line/15 bg-bg p-6 lg:border-s lg:p-8">
        <div className="flex items-center justify-between">
          <span className="text-sm tabular-nums text-muted-foreground">
            {num(look)} / {num(n - 1)}
          </span>
          <div className="flex gap-1">
            <button type="button" onClick={() => go(-1)} aria-label={t.shop.prevLook} className="flex h-11 w-11 items-center justify-center rounded-sm border border-line/20 hover:border-fg">
              <svg viewBox="0 0 26 14" className="h-3.5 w-6 rtl:-scale-x-100" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M25 7H1M7 1L1 7l6 6" />
              </svg>
            </button>
            <button type="button" onClick={() => go(1)} aria-label={t.shop.nextLook} className="flex h-11 w-11 items-center justify-center rounded-sm border border-line/20 hover:border-fg">
              <svg viewBox="0 0 26 14" className="h-3.5 w-6 rtl:-scale-x-100" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M1 7h24M19 1l6 6-6 6" />
              </svg>
            </button>
          </div>
        </div>

        <div key={p.slug} className="runway-fade flex flex-col gap-5">
          <div>
            <p className="text-sm text-muted-foreground">{t.common.by(bi(p.maker))}</p>
            <h3 className="mt-1 text-2xl">{bi(p.title)}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{bi(p.description)}</p>
            <p className="mt-3 text-lg tabular-nums">{formatSar(price, locale)}</p>
          </div>

          {p.colors.length > 1 && (
            <fieldset>
              <legend className="text-sm font-medium">
                {t.common.color}: <span className="font-normal text-muted-foreground">{bi(p.colors.find((c) => c.id === colorId)!.name)}</span>
              </legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {p.colors.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={c.id === colorId}
                    aria-label={bi(c.name)}
                    onClick={() => setColorBy((m) => ({ ...m, [p.slug]: c.id }))}
                    className={`h-9 w-9 rounded-full border-2 ${c.id === colorId ? "border-fg" : "border-transparent"}`}
                  >
                    <span className="block h-full w-full rounded-full border border-line/20" style={{ background: swatch(p, c.hex) }} />
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          <fieldset>
            <legend className="text-sm font-medium">{t.common.size}</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {p.sizes.map((sz) => (
                <button
                  key={sz.id}
                  type="button"
                  aria-pressed={sz.id === sizeId}
                  disabled={sz.stock === 0}
                  onClick={() => setSizeBy((m) => ({ ...m, [p.slug]: sz.id }))}
                  className={`min-h-11 min-w-12 rounded-sm border px-3 text-sm transition-colors disabled:opacity-40 ${sz.id === sizeId ? "border-fg bg-fg text-bg" : "border-line/25 hover:border-fg"}`}
                >
                  {bi(sz.label)}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                if (add({ slug: p.slug, color: colorId, size: sizeId })) setAdded(p.slug);
              }}
              className="min-h-12 rounded-sm bg-primary px-6 text-[15px] font-medium text-primary-fg transition-opacity hover:opacity-90"
            >
              {added === p.slug ? t.common.added : t.common.addToBag}
            </button>
            <Link href={`/shop/${p.slug}`} className="inline-flex min-h-11 items-center justify-center text-sm underline underline-offset-4">
              {t.shop.openPiece}
            </Link>
          </div>
        </div>
      </aside>
    </div>
  );
}

/** One look on the line: the photo, repainted when a yarn color is picked. */
function BodyPhoto({ product, hex }: { product: Product; hex: string | null }) {
  const src = useRecolored(product.photos[0].src, product.recolor, hex);
  // eslint-disable-next-line @next/next/no-img-element -- local photo or a repainted data URL
  return <img src={src.startsWith("data:") ? src : optimizedSrc(src, 828)} alt="" draggable={false} className="pointer-events-none h-full w-full object-cover" />;
}
