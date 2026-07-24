import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Hornussen brand palette
        meadow: {
          50: "#f2f8ee",
          100: "#e0efd6",
          200: "#c2dfae",
          300: "#9cc87d",
          400: "#79b055",
          500: "#5a9438",
          600: "#45762a",
          700: "#365b23",
          800: "#2d4a20",
          900: "#273f1e",
        },
        sky: {
          50: "#eff9ff",
          100: "#dbf0ff",
          200: "#bfe6ff",
          300: "#93d7ff",
          400: "#60c0ff",
          500: "#3aa4fb",
          600: "#2385f0",
          700: "#1c6bdc",
          800: "#1d57b2",
          900: "#1e4b8c",
        },
        nouss: {
          // wood / ochre accent for the Nouss
          100: "#f7ecd6",
          200: "#eed3a6",
          300: "#e0b56c",
          400: "#d1953c",
          500: "#bd7a25",
          600: "#a0621e",
          700: "#7f4b1c",
        },
        ink: "#12241a",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      keyframes: {
        "fly-nouss": {
          "0%": { transform: "translate(-10vw, 40vh) rotate(0deg)", opacity: "0" },
          "10%": { opacity: "1" },
          "90%": { opacity: "1" },
          "100%": { transform: "translate(90vw, -10vh) rotate(720deg)", opacity: "0" },
        },
        "float": {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      animation: {
        "fly-nouss": "fly-nouss 7s ease-in-out infinite",
        "float": "float 5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
