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
        mars: {
          dark: "#090A0F",
          surface: "#11131B",
          card: "#171A26",
          border: "#252B3B",
          hover: "#2A3246",
          red: "#FF3823",
          accent: "#FF4E36",
          glow: "rgba(255, 78, 54, 0.25)",
          gold: "#F59E0B",
          muted: "#8E98B0",
          text: "#F1F5F9"
        },
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};

export default config;
