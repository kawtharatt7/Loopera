import type { Config } from "tailwindcss";

// Colors come from CSS variables defined in src/app/globals.css.
// They are stored as RGB channels so opacity modifiers like bg-cocoa/10 work.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "rgb(var(--cream) / <alpha-value>)",
        blush: "rgb(var(--blush) / <alpha-value>)",
        sage: "rgb(var(--sage) / <alpha-value>)",
        butter: "rgb(var(--butter) / <alpha-value>)",
        berry: {
          DEFAULT: "rgb(var(--berry) / <alpha-value>)",
          dark: "rgb(var(--berry-dark) / <alpha-value>)",
        },
        cocoa: "rgb(var(--cocoa) / <alpha-value>)",
      },
      fontFamily: {
        serif: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
    },
  },
  plugins: [],
};

export default config;
