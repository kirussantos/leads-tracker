/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        base:    "#09090f",
        surface: "#0e0e18",
        card:    "#13131e",
        border:  "#1c1c2e",
        green:  { DEFAULT: "#22c55e", dim: "#16a34a" },
        amber:  { DEFAULT: "#f59e0b", dim: "#d97706" },
        red:    { DEFAULT: "#ef4444" },
        blue:   { DEFAULT: "#3b82f6" },
        violet: { DEFAULT: "#8b5cf6" },
        cyan:   { DEFAULT: "#06b6d4" },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "monospace"],
        sans: ["DM Sans", "sans-serif"],
      },
      animation: {
        "fade-up":      "fadeUp 0.35s ease forwards",
        "fade-in":      "fadeIn 0.3s ease forwards",
        "pulse-glow":   "pulseGlow 2.5s ease-in-out infinite",
        "pulse-dot":    "pulseDot 2s ease-in-out infinite",
        "slide-in":     "slideIn 0.3s ease forwards",
        "ticker":       "tickerScroll 28s linear infinite",
        "ticker-slow":  "tickerScroll 45s linear infinite",
        "ticker-vslow": "tickerScroll 65s linear infinite",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: 0, transform: "translateY(10px)" },
          to:   { opacity: 1, transform: "translateY(0)" },
        },
        fadeIn: {
          from: { opacity: 0 },
          to:   { opacity: 1 },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 8px rgba(34,197,94,0.25)" },
          "50%":      { boxShadow: "0 0 22px rgba(34,197,94,0.55)" },
        },
        pulseDot: {
          "0%, 100%": { opacity: 1, transform: "scale(1)" },
          "50%":      { opacity: 0.4, transform: "scale(0.85)" },
        },
        slideIn: {
          from: { opacity: 0, transform: "translateX(-8px)" },
          to:   { opacity: 1, transform: "translateX(0)" },
        },
        tickerScroll: {
          "0%":   { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
    },
  },
  plugins: [],
};
