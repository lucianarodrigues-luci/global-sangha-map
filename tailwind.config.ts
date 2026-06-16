import type { Config } from "tailwindcss";

/**
 * Tailwind configuration.
 * All colors are drawn exclusively from the Tergar / AAM brand guidelines
 * (see specs.md "Color Palette" / "Color Usage" / "Map Marker Colors").
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Official Tergar brand palette (tergar.org brand guidelines).
        primary: "#1B4087", // Tergar Blue — primary actions / CTA
        gold: "#E39F24", // Tergar Gold — symbol / accent
        "tergar-blue": "#1B4087", // Tergar Blue
        "space-blue": "#424A58", // Space Blue — body text
        midnight: "#1B4087", // Headings (deep Tergar blue)
        // Gradient accent tints (brand gradient palette)
        "gold-tint": "#F2D4A8", // Yellow gradient
        peach: "#FBE0C9", // Peach gradient
        "blue-tint": "#8FB6F3", // Blue gradient
        // Base / neutral tokens
        canvas: "#F9F9FB", // Base 02 — background
        card: "#FFFFFF", // Base 01 — cards
        hairline: "#C1C7D1", // Base 04 — borders
        muted: "#67748A", // Base 05 — muted text
      },
      fontFamily: {
        sans: ["var(--font-nunito-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["var(--font-source-serif)", "ui-serif", "Georgia", "serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
      },
      boxShadow: {
        soft: "0 4px 24px rgba(66, 74, 88, 0.08)",
        "soft-lg": "0 8px 40px rgba(66, 74, 88, 0.12)",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        // Gentle fade-in only — no bounce / flashing / fast movement (per spec).
        fadeIn: "fadeIn 0.4s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
