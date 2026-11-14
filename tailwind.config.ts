import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        neu: {
          bg: "#F2F4F8",
          surface: "#ECEFF4",
          card: "#FFFFFF",
          border: "#E2E8F0",
          shadow: "#A3B1C6",
          text: "#121316",
          muted: "#8C92A4",
          obsidian: "#121316",
        },
        obsidian: {
          DEFAULT: "#121316",
          card: "#1B1C20",
          hover: "#25272C",
        },
      },
      borderRadius: {
        '3xl': '1.75rem',
        '4xl': '2.25rem',
      },
    },
  },
  plugins: [],
};

export default config;
