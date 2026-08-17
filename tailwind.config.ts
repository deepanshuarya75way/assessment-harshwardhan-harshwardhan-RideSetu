import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#060D17",
          900: "#0A192F",
          850: "#0D213D",
          800: "#132D54",
          700: "#1E3A8A",
          600: "#2563EB",
        },
        brand: {
          orange: "#FF6B00",
          amber: "#F59E0B",
          dark: "#E05300",
          light: "#FFF4EB",
        },
        emerald: {
          500: "#10B981",
          600: "#059669",
          700: "#047857",
        }
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        heading: ["var(--font-heading)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        'glow': '0 0 20px -5px rgba(255, 107, 0, 0.3)',
        'card': '0 10px 30px -10px rgba(10, 25, 47, 0.08)',
        'hover': '0 20px 40px -15px rgba(10, 25, 47, 0.15)',
      }
    },
  },
  plugins: [],
};
export default config;
