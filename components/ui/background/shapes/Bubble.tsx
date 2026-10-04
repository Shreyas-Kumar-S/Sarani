import React, { useId } from 'react';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import type { ShapeProps } from './types';

// A true bubble: glassy interior brightening toward the edge, a defined rim,
// and a small specular highlight. Fills are radial gradients (no SVG blur
// filter, which clipped/banded on iOS and did nothing on Android), so they
// render smoothly on both platforms.
export function Bubble({ size, color, opacity }: ShapeProps) {
  // Gradient ids are document-global in react-native-svg; two bubbles with
  // the same id would share (and fight over) one gradient.
  const gradientId = `bubble-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const r = size / 2;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Defs>
        <RadialGradient id={gradientId} cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={color} stopOpacity={opacity * 0.05} />
          <Stop offset="70%" stopColor={color} stopOpacity={opacity * 0.13} />
          <Stop offset="100%" stopColor={color} stopOpacity={opacity * 0.3} />
        </RadialGradient>
      </Defs>
      <Ellipse
        cx={r}
        cy={r}
        rx={r - 1.5}
        ry={r - 1.5}
        fill={`url(#${gradientId})`}
        stroke={color}
        strokeWidth={2}
        strokeOpacity={opacity * 0.9}
      />
      <Ellipse
        cx={size * 0.33}
        cy={size * 0.29}
        rx={size * 0.1}
        ry={size * 0.07}
        fill="#FFFFFF"
        opacity={opacity * 0.6}
      />
    </Svg>
  );
}
