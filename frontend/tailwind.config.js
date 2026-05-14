/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        base: "#0a0a0f",
        surface: "#111118",
        card: "#16161f",
        border: "#1e1e2e",
        green: { DEFAULT: "#22c55e", dim: "#16a34a" },
        amber: { DEFAULT: "#f59e0b", dim: "#d97706" },
        red: { DEFAULT: "#ef4444" },
        blue: { DEFAULT: "#3b82f6" },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "monospace"],
        sans: ["DM Sans", "sans-serif"],
      },
      animation: {
        "fade-up": "fadeUp 0.4s ease forwards",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: 0, transform: "translateY(16px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 8px #22c55e40" },
          "50%": { boxShadow: "0 0 20px #22c55e80" },
        },
      },
    },
  },
  plugins: [],
};
