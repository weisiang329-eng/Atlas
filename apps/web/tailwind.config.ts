import type { Config } from "tailwindcss";

/*
 * Atlas Tailwind config — colours map 1:1 to the CSS-variable tokens in
 * app/globals.css (never hardcode hex in components).
 *
 * VISUAL REFRESH v0.2 (Aurora Glass) — ADDITIVE. New: surface-3, border-soft/
 * border-strong colours; radius-panel bumped 0.5rem → 0.75rem + rounded-pill;
 * shadow-panel refined + shadow-pop / shadow-glow; skeleton-safelisted classes.
 * Nothing removed — existing utilities keep resolving.
 */
const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        "surface-3": "var(--surface-3)",
        border: "var(--border)",
        "border-soft": "var(--border-soft)",
        "border-strong": "var(--border-strong)",
        fg: "var(--fg)",
        muted: "var(--muted)",
        faint: "var(--faint)",
        accent: "var(--accent)",
        "accent-dim": "var(--accent-dim)",
        positive: "var(--positive)",
        negative: "var(--negative)",
        warning: "var(--warning)",
        info: "var(--info)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
        serif: ["var(--font-serif)", "ui-serif", "Georgia", "serif"],
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem", letterSpacing: "0.04em" }],
      },
      borderRadius: {
        // Controls use `rounded` (0.5rem); surfaces use `rounded-panel` (0.75rem).
        panel: "0.75rem",
        pill: "999px",
      },
      boxShadow: {
        // Single soft ambient card elevation; `pop` for menus/drawers; `glow`
        // for the accent focus / live-data emphasis.
        panel:
          "0 1px 0 0 rgba(255,255,255,0.02) inset, 0 1px 2px rgba(0,0,0,0.4), 0 8px 24px -12px rgba(0,0,0,0.55)",
        pop: "0 12px 40px -12px rgba(0,0,0,0.7)",
        glow: "0 0 0 1px rgba(242,177,61,0.25), 0 0 18px -4px rgba(242,177,61,0.45)",
      },
    },
  },
  // Skeleton / flash / glass utilities live in globals.css @layer components; the
  // dynamic class names below are safelisted so JIT keeps them in the export.
  safelist: ["skeleton", "flash-up", "flash-down", "glass", "num"],
  plugins: [],
};

export default config;
