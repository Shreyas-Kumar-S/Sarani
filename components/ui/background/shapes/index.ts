import type { ComponentType } from 'react';
import { Bubble } from './Bubble';
import { Bulb } from './Bulb';
import type { ShapeProps } from './types';

export type { ShapeProps } from './types';

// Every shape the background can float, by name. The orb list in
// AnimatedBackground refers to shapes by these names, so swapping what
// floats (or letting the user choose) is a matter of changing a string —
// nothing about motion or layout has to know a new shape exists.
export const SHAPES = {
  bubble: Bubble,
  bulb: Bulb,
} satisfies Record<string, ComponentType<ShapeProps>>;

export type ShapeKind = keyof typeof SHAPES;
