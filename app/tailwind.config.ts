import type { Config } from "tailwindcss";

/** Tailwind is wired to the design tokens so hand-written components share the ported screens' palette. */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  corePlugins: { preflight: false },
  theme: {
    extend: {
      screens: { shell: "901px" },
      colors: {
        bg: "var(--bg)",
        surface: { DEFAULT: "var(--surface)", 2: "var(--surface-2)", 3: "var(--surface-3)" },
        line: { DEFAULT: "var(--border)", strong: "var(--border-strong)" },
        ink: { DEFAULT: "var(--text)", 2: "var(--text-2)", muted: "var(--muted)", faint: "var(--faint)" },
        accent: { DEFAULT: "var(--accent)", ink: "var(--accent-ink)", soft: "var(--accent-soft)", line: "var(--accent-border)" },
        primary: { DEFAULT: "var(--primary)", text: "var(--primary-text)" },
        danger: "var(--red)",
      },
      fontFamily: { sans: ["Geist", "system-ui", "sans-serif"], mono: ["Geist Mono", "monospace"] },
      boxShadow: { sm: "var(--shadow-sm)", md: "var(--shadow-md)", lg: "var(--shadow-lg)" },
    },
  },
};
export default config;
