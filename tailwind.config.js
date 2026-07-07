/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./screens/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],

  presets: [require("nativewind/preset")],

  theme: {
    extend: {
      colors: {
        /* Brand */
        primary: {
          DEFAULT: "#7A9B76",
          light: "#9DB89A",
          dark: "#5F7A5C",
        },

        /* Light Mode Surfaces */
        surface: {
          page: "hsla(35, 28%, 98%, 1)",
          primary: "hsla(35, 28%, 97%, 1)",
          secondary: "hsla(35, 20%, 96%, 1)",
          inset: "hsla(120, 15%, 95%, 1)",
          nav: "hsla(35, 28%, 97%, 1)",
        },

        /* Dark Mode Surfaces — near-black ramp with subtle layering */
        'surface-dark': {
          page: "black",
          primary: "hsla(0, 0%, 2%, 1)",
          secondary: "hsla(0, 0%,2%, 1)",
          inset: "hsla(120, 5%, 10%, 1)",
          nav: "hsla(0, 0%, 6%, 1)",
        },

        /* Light Mode Text */
        ink: {
          primary: "rgba(0,0,0,0.85)",
          secondary: "rgba(0,0,0,0.60)",
          tertiary: "rgba(0,0,0,0.40)",
          quaternary: "rgba(0,0,0,0.25)",
          onPrimary: "rgba(255,255,255,0.90)",
          link: "#7A9B76",
        },

        /* Dark Mode Text */
        'ink-dark': {
          primary: "rgba(255,255,255,0.90)",
          secondary: "rgba(255,255,255,0.70)",
          tertiary: "rgba(255,255,255,0.50)",
          quaternary: "rgba(255,255,255,0.30)",
          onPrimary: "rgba(0,0,0,0.85)",
          link: "#9DB89A",
        },

        /* Status */
        success: {
          DEFAULT: "#D4E7D2",
          light: "#EBF5EA",
        },
        warning: {
          DEFAULT: "#F0E8D9",
          light: "#F7F3EB",
        },
        error: {
          DEFAULT: "#E8D5D3",
          light: "#F5EDEC",
        },
      },

      fontFamily: {
        serif: ["Georgia", "Times New Roman", "SimSun", "serif"],
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },

      borderRadius: {
        xs: "4px",
        sm: "8px",
        md: "12px",
        full: "9999px",
      },

      spacing: {
        compact: "12px",
        standard: "20px",
        generous: "32px",
      },
    },
  },

  plugins: [],
};