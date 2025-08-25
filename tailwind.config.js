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
  safelist: [
    {
      pattern: /(bg|text|border)-(red|blue|green|yellow|pink|purple|gray)-(100|200|300|400|500|600|700|800|900)/,
    },
    "flex-1",
    "items-center",
    "justify-center",
  ],
  theme: {
    extend: {
      colors: {
        primary: { light: "#60a5fa", DEFAULT: "#3b82f6", dark: "#1e40af" },
        secondary: { light: "#f9a8d4", DEFAULT: "#ec4899", dark: "#9d174d" },
        success: "#22c55e",
        warning: "#eab308",
        danger: "#ef4444",
        darkbg: "#121212",
      },
      fontFamily: {
        sans: ["System", "Helvetica Neue", "Arial"],
        display: ["Poppins", "System"],
        mono: ["Menlo", "Courier"],
      },
    },
  },
  plugins: [],
  darkMode: "class",
};
