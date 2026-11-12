import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        midnight: {
          950: "#070D12",
          900: "#0B1519",
          850: "#0E1A20",
          800: "#13232B",
          700: "#1E3541",
        },
      },
      animation: {
        "fade-in": "fadeIn 0.15s ease-out forwards",
        "fade-in-scale": "fadeIn 0.15s ease-out forwards",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", filter: "blur(5px)" },
          "100%": { opacity: "1", filter: "blur(0px)" },
        },
        fadeInScale: {
          "0%": { opacity: "0", filter: "blur(5px)" },
          "100%": { opacity: "1", filter: "blur(0px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
