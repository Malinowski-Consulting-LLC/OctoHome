import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#ffffff",
        foreground: "#000000",
        primary: {
          DEFAULT: "#000000",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#f4f4f5",
          foreground: "#18181b",
        },
        accent: {
          DEFAULT: "#004a99",
          foreground: "#ffffff",
        },
        border: "#000000",
      },
      fontFamily: {
        sans: ["Atkinson Hyperlegible", "sans-serif"],
      },
      borderRadius: {
        lg: "1rem",
        md: "0.75rem",
        sm: "0.5rem",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
