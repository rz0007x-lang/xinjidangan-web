import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#5f5063",
        mist: "#fff7fb",
        sage: "#d78fb0",
        clay: "#e7bfd1",
        linen: "#fffdfb",
        line: "#f0dfe7"
      },
      boxShadow: {
        soft: "0 20px 48px rgba(199, 150, 177, 0.16)"
      }
    }
  },
  plugins: []
};

export default config;
