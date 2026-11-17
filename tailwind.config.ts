import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        lime: "var(--lime)", pink: "var(--pink)", orange: "var(--orange)",
        yellow: "var(--yellow)", blue: "var(--blue)", ink: "var(--ink)",
        cream: "var(--cream)", paper: "var(--white)",
      },
      fontFamily: {
        display: ["Anton", "Impact", "sans-serif"],
        body: ["DM Sans", "Arial", "sans-serif"],
        accent: ["DM Serif Display", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
