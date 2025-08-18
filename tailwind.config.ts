import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "shamash-blue": "#2DC2F0",
        "shamash-dark-blue": "#1A1C53",
        "shamash-yellow": "#F5B942",
        "shamash-purple": "#7664C5",
        "shamash-white": "#ffffff",
      },
    },
  },
  plugins: [],
};
export default config; 