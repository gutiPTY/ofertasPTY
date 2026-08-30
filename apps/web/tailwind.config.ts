import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        ink: "var(--ink)",
        paper: "var(--paper)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        line: "var(--line)",
        muted: "var(--muted)",
        ember: "var(--ember)",
        "ember-ink": "var(--ember-ink)",
        flare: "var(--flare)",
        spark: "var(--spark)",
        success: "var(--success)",
        "success-bg": "var(--success-bg)",
        warning: "var(--warning)",
        "warning-bg": "var(--warning-bg)",
        critical: "var(--critical)",
        "critical-bg": "var(--critical-bg)",
      },
      fontFamily: {
        display: ["var(--font-fredoka)", "ui-rounded", "sans-serif"],
        sans: ["var(--font-manrope)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
