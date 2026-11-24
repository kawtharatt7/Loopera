import type { Config } from "tailwindcss";

// Every color is a CSS variable from src/app/globals.css (RGB channels), so the whole look,
// in both dark and light mode, changes by editing the tokens there.
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Brand palette
        wine: token("wine"),
        ember: token("ember"),
        peach: token("peach"),
        rose: token("rose"),
        terracotta: token("terracotta"),
        sage: token("sage"),
        hero: token("hero"),
        "on-wine": token("on-wine"),
        paper: { DEFAULT: token("paper"), fg: token("on-paper") },
        // Semantic tokens
        bg: token("bg"),
        surface: { DEFAULT: token("surface"), 2: token("surface-2") },
        fg: token("fg"),
        line: token("border"),
        primary: { DEFAULT: token("primary"), fg: token("on-primary"), foreground: token("on-primary") },
        /** Small accent text: rose in dark mode, wine in light mode. */
        brand: token("accent-text"),
        // shadcn-style aliases, so copied UI components (bg-background, text-foreground…) follow the theme
        background: token("bg"),
        foreground: token("fg"),
        card: { DEFAULT: token("surface"), foreground: token("fg") },
        popover: { DEFAULT: token("surface"), foreground: token("fg") },
        muted: { DEFAULT: token("surface-2"), foreground: token("muted-fg") },
        accent: { DEFAULT: token("surface-2"), foreground: token("fg") },
        border: token("border"),
        input: token("border"),
        ring: token("ring"),
        secondary: { DEFAULT: token("surface-2"), foreground: token("fg") },
        destructive: { DEFAULT: token("ember"), foreground: token("fg") },
      },
      fontFamily: {
        // Alexandria for headings, IBM Plex Sans Arabic for text; both cover Arabic and Latin.
        serif: ["Alexandria", "Tahoma", "sans-serif"],
        sans: ["IBM Plex Sans Arabic", "Tahoma", "system-ui", "sans-serif"],
      },
      // Near-square corners everywhere: soft enough not to cut, never pill-shaped.
      borderRadius: {
        none: "0",
        sm: "2px",
        DEFAULT: "2px",
        md: "3px",
        lg: "3px",
        xl: "4px",
        "2xl": "4px",
        "3xl": "6px",
        "4xl": "6px",
        "5xl": "6px",
      },
      keyframes: {
        shimmer: { "100%": { transform: "translateX(100%)" } },
      },
      animation: {
        shimmer: "shimmer 1.6s infinite",
      },
    },
  },
  plugins: [],
};

export default config;
