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
        ink: "#263238",
        mist: "#f6f7f4",
        sage: "#6f8d75",
        clay: "#b7795d",
        linen: "#fbfaf7",
        line: "#e4e1d9"
      },
      boxShadow: {
        soft: "0 18px 45px rgba(38, 50, 56, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
