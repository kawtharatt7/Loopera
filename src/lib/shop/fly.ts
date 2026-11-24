"use client";

/** The piece being added: the biggest visible image near the button that was pressed. */
export function sourceImage(from: Element | null): HTMLImageElement | null {
  let el: Element | null = from;
  while (el && el !== document.body) {
    const imgs = [...el.querySelectorAll("img")].filter((i) => {
      const r = i.getBoundingClientRect();
      return r.width > 24 && r.height > 24 && r.bottom > 0 && r.top < innerHeight;
    });
    if (imgs.length) return imgs.sort((a, b) => b.clientWidth * b.clientHeight - a.clientWidth * a.clientHeight)[0];
    el = el.parentElement;
  }
  return null;
}

/** Sends a copy of the piece flying into the bag icon in the header, then gives the icon a small bounce. */
export function flyToBag(img: HTMLImageElement | null): void {
  const target = document.querySelector<HTMLElement>("[data-bag-icon]");
  if (!target) return;
  const bump = () => target.animate([{ transform: "scale(1)" }, { transform: "scale(1.28)" }, { transform: "scale(1)" }], { duration: 380, easing: "ease-out" });
  if (!img || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return void bump();
  const a = img.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  const dx = b.left + b.width / 2 - (a.left + a.width / 2);
  const dy = b.top + b.height / 2 - (a.top + a.height / 2);
  const ghost = document.createElement("img");
  ghost.src = img.currentSrc || img.src;
  ghost.alt = "";
  Object.assign(ghost.style, { position: "fixed", left: `${a.left}px`, top: `${a.top}px`, width: `${a.width}px`, height: `${a.height}px`, zIndex: "1000", pointerEvents: "none", margin: "0", objectFit: "contain", borderRadius: "6px" });
  document.body.appendChild(ghost);
  const fly = ghost.animate(
    [
      { transform: "translate(0,0) scale(1) rotate(0deg)", opacity: 1 },
      { transform: `translate(${dx * 0.45}px, ${dy * 0.45 - 60}px) scale(0.55) rotate(-6deg)`, opacity: 1, offset: 0.5 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.05) rotate(4deg)`, opacity: 0.4 },
    ],
    { duration: 950, easing: "cubic-bezier(.55,0,.25,1)" },
  );
  fly.onfinish = () => {
    ghost.remove();
    bump();
  };
}
