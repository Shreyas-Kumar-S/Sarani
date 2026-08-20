// TypeScript 6 stopped auto-including @types/jest here, so the test globals
// (describe/it/expect) went missing. Referenced explicitly rather than via
// compilerOptions.types, which would suppress auto-inclusion of every other
// @types package.
/// <reference types="jest" />

declare module '*.svg' {
  import React from 'react';
  import { SvgProps } from 'react-native-svg';
  const content: React.FC<SvgProps>;
  export default content;
}

declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
// Side-effect import in app/_layout.tsx (Tailwind entrypoint). TypeScript 6
// requires a declaration for it; NativeWind's own types don't provide one.
declare module '*.css';
