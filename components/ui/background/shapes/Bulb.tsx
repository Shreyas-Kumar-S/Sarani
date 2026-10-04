import React, { useId } from 'react';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import type { ShapeProps } from './types';

// A mostly-solid coloured core that only softens over the last stretch, so
// it reads as a clear glowing circle. Used for the large bottom anchors.
const BULB_STOPS = [
  { offset: '0%', mult: 1 },
  { offset: '58%', mult: 0.96 },
  { offset: '80%', mult: 0.72 },
  { offset: '93%', mult: 0.32 },
  { offset: '100%', mult: 0 },
];

export function Bulb({ size, color, opacity }: ShapeProps) {
  const gradientId = `bulb-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const r = size / 2;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Defs>
        <RadialGradient id={gradientId} cx="50%" cy="50%" r="50%">
          {BULB_STOPS.map((s) => (
            <Stop
              key={s.offset}
              offset={s.offset}
              stopColor={color}
              stopOpacity={opacity * s.mult}
            />
          ))}
        </RadialGradient>
      </Defs>
      <Ellipse cx={r} cy={r} rx={r} ry={r} fill={`url(#${gradientId})`} />
    </Svg>
  );
}
