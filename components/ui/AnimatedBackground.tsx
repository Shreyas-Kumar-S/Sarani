import { useColorScheme } from 'nativewind';
import React from 'react';
import Animated from 'react-native-reanimated';
import { Floater, type FloaterMotion } from './background/Floater';
import { SHAPES, type ShapeKind } from './background/shapes';

type OrbSpec = FloaterMotion & {
  shape: ShapeKind;
  left: number;
  top: number;
  size: number;
  opacity: number;
};

// The persistent atmospheric layer behind the tabs. Rendered once in the
// tabs layout, not per screen, so switching tabs never remounts it.
//
// Each entry names a shape from the registry and describes where it sits
// and how it drifts. Motion lives in Floater; the picture lives in the
// shape. Changing what floats means changing `shape` here, nothing else.
export default function AnimatedBackground() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  // A visible sage in both themes so the orbs read (dark needs a lit tint, not
  // near-black, or nothing shows against the background).
  const orbColor = isDark ? '#4A5E3E' : '#82AC78';

  const orbs: OrbSpec[] = [
    // Large bottom anchors — soft bulbs.
    {
      shape: 'bulb',
      motion: 'loop',
      left: -70,
      top: 560,
      size: 300,
      opacity: isDark ? 0.12 : 0.5,
      driftX: 55,
      driftY: 72,
      durationX: 5000,
      durationY: 6400,
      delay: 0,
    },
    {
      shape: 'bulb',
      motion: 'loop',
      left: 190,
      top: 620,
      size: 260,
      opacity: isDark ? 0.1 : 0.46,
      driftX: 64,
      driftY: 80,
      durationX: 5600,
      durationY: 4400,
      delay: 300,
    },
    // Floating ones — true bubbles, wandering rather than looping so they
    // never retrace a figure.
    {
      shape: 'bubble',
      motion: 'wander',
      left: 70,
      top: 380,
      size: 190,
      opacity: isDark ? 0.14 : 0.6,
      driftX: 82,
      driftY: 74,
      durationX: 3400,
      durationY: 4200,
      delay: 700,
    },
    {
      shape: 'bubble',
      motion: 'wander',
      left: 250,
      top: 190,
      size: 120,
      opacity: isDark ? 0.18 : 0.7,
      driftX: 96,
      driftY: 108,
      durationX: 2700,
      durationY: 2300,
      delay: 500,
    },
    {
      shape: 'bubble',
      motion: 'wander',
      left: -20,
      top: 300,
      size: 140,
      opacity: isDark ? 0.14 : 0.6,
      driftX: 80,
      driftY: 92,
      durationX: 3100,
      durationY: 2600,
      delay: 1000,
    },
    {
      shape: 'bubble',
      motion: 'wander',
      left: 160,
      top: 480,
      size: 95,
      opacity: isDark ? 0.18 : 0.72,
      driftX: 104,
      driftY: 90,
      durationX: 2400,
      durationY: 2900,
      delay: 200,
    },
  ];

  return (
    <Animated.View
      pointerEvents="none"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      {orbs.map(({ shape, opacity, ...floater }) => {
        const Shape = SHAPES[shape];
        return (
          <Floater key={`${shape}-${floater.left}-${floater.top}`} {...floater}>
            <Shape size={floater.size} color={orbColor} opacity={opacity} />
          </Floater>
        );
      })}
    </Animated.View>
  );
}
