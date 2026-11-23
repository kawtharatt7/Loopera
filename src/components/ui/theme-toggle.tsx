"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { applyTheme, readTheme, type Theme } from "@/lib/theme";

export function useTheme(): Theme {
  const [theme, setTheme] = useState<Theme>("dark");
  useEffect(() => {
    setTheme(readTheme());
    const onChange = () => setTheme(readTheme());
    window.addEventListener("loopera-theme", onChange);
    return () => window.removeEventListener("loopera-theme", onChange);
  }, []);
  return theme;
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const theme = useTheme();
  const next: Theme = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={() => applyTheme(next)}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
      className={`relative inline-flex h-11 w-11 cursor-pointer items-center justify-center overflow-hidden rounded-xl text-fg transition-colors hover:bg-surface-2 ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.svg
          key={theme}
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          aria-hidden="true"
          initial={{ y: 14, opacity: 0, rotate: -40 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          exit={{ y: -14, opacity: 0, rotate: 40 }}
          transition={{ duration: 0.22 }}
        >
          {theme === "dark" ? (
            <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
          ) : (
            <>
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </>
          )}
        </motion.svg>
      </AnimatePresence>
    </button>
  );
}
