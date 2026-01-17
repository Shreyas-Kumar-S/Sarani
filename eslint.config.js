import { FlatCompat } from "@eslint/eslintrc";
import prettierPlugin from "eslint-plugin-prettier";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

export default [
  // ✅ Expo legacy config (wrapped safely)
  ...compat.extends("expo"),

  // ✅ Apply to source files
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      "prettier/prettier": "error",
    },
  },

  // ✅ Disable conflicting ESLint formatting rules
  ...compat.extends("prettier"),
];
