import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary brand palette (Emerald Stitch tokens)
        primary: {
          DEFAULT: "#006948",
          hover: "#059669",
          light: "#85F8C4",
          soft: "#ECFDF5",
          container: "#00855d",
          fixed: "#85f8c4",
          "fixed-dim": "#68dba9",
        },
        "primary-light": "#85F8C4",
        "primary-soft": "#ECFDF5",
        "on-primary": "#ffffff",
        "on-primary-container": "#f5fff7",
        "inverse-primary": "#68dba9",

        // Water (Secondary) palette
        water: {
          DEFAULT: "#006398",
          hover: "#0284C7",
          light: "#38BDF8",
          soft: "#CCE5FF",
        },
        "water-soft": "#CCE5FF",
        secondary: {
          DEFAULT: "#006398",
          hover: "#0284C7",
          light: "#38BDF8",
          soft: "#CCE5FF",
          container: "#5bb8fe",
          fixed: "#cce5ff",
          "fixed-dim": "#93ccff",
        },
        "on-secondary": "#ffffff",
        "on-secondary-container": "#00476e",

        // Calorie (Tertiary) palette
        calorie: {
          DEFAULT: "#825100",
          hover: "#F59E0B",
          light: "#FFB95F",
          soft: "#FFDDB8",
        },
        "calorie-soft": "#FFDDB8",
        tertiary: {
          DEFAULT: "#825100",
          hover: "#F59E0B",
          light: "#FFB95F",
          soft: "#FFDDB8",
          container: "#a36700",
          fixed: "#ffddb8",
          "fixed-dim": "#ffb95f",
        },
        "on-tertiary": "#ffffff",
        "on-tertiary-container": "#fffbff",

        // Surface palette
        surface: {
          DEFAULT: "#FAF8FF",
          50: "#FAF8FF",
          100: "#F8FAFC",
          200: "#F2F3FF",
          300: "#E2E7FF",
          white: "#FFFFFF",
          dim: "#d2d9f4",
          bright: "#faf8ff",
          container: {
            lowest: "#ffffff",
            low: "#f2f3ff",
            DEFAULT: "#eaedff",
            high: "#e2e7ff",
            highest: "#dae2fd",
          },
        },
        "surface-dim": "#d2d9f4",
        "surface-bright": "#faf8ff",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f2f3ff",
        "surface-container": "#eaedff",
        "surface-container-high": "#e2e7ff",
        "surface-container-highest": "#dae2fd",

        // Text palette
        "app-text": {
          DEFAULT: "#131B2E",
          main: "#131B2E",
          dark: "#0F172A",
          muted: "#64748B",
        },
        "on-surface": "#131b2e",
        "on-surface-variant": "#3d4a42",
        "inverse-surface": "#283044",
        "inverse-on-surface": "#eef0ff",
        outline: "#6d7a72",
        "outline-variant": "#bccac0",
        "surface-tint": "#006c4a",

        // Error palette
        "app-error": {
          DEFAULT: "#BA1A1A",
          hover: "#E11D48",
        },
        error: {
          DEFAULT: "#ba1a1a",
          hover: "#e11d48",
          container: "#ffdad6",
        },
        "on-error": "#ffffff",
        "on-error-container": "#93000a",
      },
      borderRadius: {
        card: "16px",
        hero: "24px",
        pill: "9999px",
      },
      boxShadow: {
        soft: "0 2px 12px 0 rgba(19, 27, 46, 0.04)",
        card: "0 4px 20px 0 rgba(19, 27, 46, 0.05)",
        hero: "0 8px 30px 0 rgba(19, 27, 46, 0.08)",
      },
      fontFamily: {
        sans: ["var(--font-plus-jakarta)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
