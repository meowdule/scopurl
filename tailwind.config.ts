import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        page: {
          DEFAULT: "var(--bg-page)",
          alt: "var(--bg-page-2)",
        },
        fg: {
          DEFAULT: "var(--fg)",
          muted: "var(--fg-muted)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          dim: "var(--accent-dim)",
          soft: "var(--accent-soft)",
        },
        card: {
          DEFAULT: "var(--card)",
          border: "var(--card-border)",
        },
        /* legacy aliases used across components */
        surface: {
          DEFAULT: "var(--card)",
          raised: "var(--card)",
          border: "var(--card-border)",
        },
      },
      boxShadow: {
        card: "var(--shadow)",
        cardSm: "var(--shadow-sm)",
        cardHero: "0 12px 32px rgba(15, 23, 42, 0.08)",
      },
      borderRadius: {
        panel: "16px",
      },
      fontFamily: {
        sans: ["Pretendard", "var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        shake: {
          "0%, 100%": { transform: "rotate(0deg)" },
          "25%": { transform: "rotate(-12deg)" },
          "75%": { transform: "rotate(12deg)" },
        },
        bounceRun: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-2px)" },
        },
      },
      animation: {
        marquee: "marquee 24s linear infinite",
        shake: "shake 0.4s ease-in-out infinite",
        bounceRun: "bounceRun 0.35s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
