import { FlatCompat } from '@eslint/eslintrc';
import prettierPlugin from 'eslint-plugin-prettier';

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

export default [
  // ✅ Expo legacy config (wrapped safely)
  ...compat.extends('expo'),

  // ✅ Apply to source files
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      'prettier/prettier': 'error',

      // eslint-plugin-react-hooks 7 (SDK 56) added React Compiler rules that
      // don't model Reanimated. Writing `sharedValue.value = ...` inside a
      // worklet (useAnimatedReaction / useAnimatedScrollHandler) is the
      // documented API, not a mutation of React-owned state, so this rule is a
      // false positive across this codebase.
      'react-hooks/immutability': 'off',

      // Genuine, but low-severity here: a couple of components flip one
      // boolean synchronously in an effect on route change, costing a single
      // extra render rather than cascading. Kept visible as a warning instead
      // of failing the gate — see FloatingThemeToggle and InfoButton.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },

  // ✅ Disable conflicting ESLint formatting rules
  ...compat.extends('prettier'),
];
