export type Theme = "dark" | "light";

export const THEME_STORAGE_KEY = "loopera-theme";
export const DEFAULT_THEME: Theme = "light";

/** Inline script run in <head> before paint. Kept tiny and wrapped in try/catch. */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");document.documentElement.setAttribute("data-theme",t==="dark"?"dark":"light");}catch(e){document.documentElement.setAttribute("data-theme","light");}})();`;

export function readTheme(): Theme {
  if (typeof document === "undefined") return DEFAULT_THEME;
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage can be unavailable (private mode, embedded views). The theme still applies for this visit.
  }
  window.dispatchEvent(new CustomEvent("loopera-theme", { detail: theme }));
}
