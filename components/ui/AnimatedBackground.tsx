import { useColorScheme } from 'nativewind';
import React, { useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';

type OrbVariant = 'bulb' | 'bubble';

type OrbProps = {
  left: number;
  top: number;
  size: number; // diameter of the orb's bounding box
  variant: OrbVariant;
  color: string;
  opacity: number;
  driftX: number;
  driftY: number;
  durationX: number;
  durationY: number;
  delay: number;
};

// "bulb": a mostly-solid colored core that only softens over the last stretch,
// so it reads as a clear glowing circle (used for the large bottom anchors).
const BULB_STOPS = [
  { offset: '0%', mult: 1 },
  { offset: '58%', mult: 0.96 },
  { offset: '80%', mult: 0.72 },
  { offset: '93%', mult: 0.32 },
  { offset: '100%', mult: 0 },
];

// A single floating orb. Fills are radial gradients (no SVG blur filter — that
// clipped/banded on iOS and did nothing on Android), so they render smoothly on
// both platforms. Motion is an organic looping drift plus a gentle breathing.
function Orb({
  left,
  top,
  size,
  variant,
  color,
  opacity,
  driftX,
  driftY,
  durationX,
  durationY,
  delay,
}: OrbProps) {
  const px = useSharedValue(0);
  const py = useSharedValue(0);

  useEffect(() => {
    px.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: durationX, easing: Easing.inOut(Easing.sin) }), -1, true)
    );
    py.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: durationY, easing: Easing.inOut(Easing.sin) }), -1, true)
    );
    // px/py are stable shared values; durations/delay are constant props.
  }, [px, py, durationX, durationY, delay]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: (px.value - 0.5) * driftX * 2 },
      { translateY: (py.value - 0.5) * driftY * 2 },
      { scale: 0.92 + px.value * 0.16 },
    ],
  }));

  const gradientId = `orb-${left}-${top}`;
  const r = size / 2;

  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', left, top, width: size, height: size }, animStyle]}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {variant === 'bulb' ? (
          <>
            <Defs>
              <RadialGradient id={gradientId} cx="50%" cy="50%" r="50%">
                {BULB_STOPS.map((s) => (
                  <Stop key={s.offset} offset={s.offset} stopColor={color} stopOpacity={opacity * s.mult} />
                ))}
              </RadialGradient>
            </Defs>
            <Ellipse cx={r} cy={r} rx={r} ry={r} fill={`url(#${gradientId})`} />
          </>
        ) : (
          <>
            {/* True bubble: glassy interior brightening toward the edge, a
                defined rim, and a small specular highlight. */}
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
          </>
        )}
      </Svg>
    </Animated.View>
  );
}

export default function AnimatedBackground() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  // A visible sage in both themes so the orbs read (dark needs a lit tint, not
  // near-black, or nothing shows against the background).
  const orbColor = isDark ? '#4A5E3E' : '#82AC78';

  const orbs: OrbProps[] = [
    // Large bottom anchors — soft bulbs.
    { left: -70, top: 560, size: 300, variant: 'bulb', color: orbColor, opacity: isDark ? 0.12 : 0.5, driftX: 55, driftY: 72, durationX: 5000, durationY: 6400, delay: 0 },
    { left: 190, top: 620, size: 260, variant: 'bulb', color: orbColor, opacity: isDark ? 0.1 : 0.46, driftX: 64, driftY: 80, durationX: 5600, durationY: 4400, delay: 300 },
    // Floating ones — true bubbles.
    { left: 70, top: 380, size: 190, variant: 'bubble', color: orbColor, opacity: isDark ? 0.14 : 0.6, driftX: 82, driftY: 74, durationX: 4200, durationY: 5200, delay: 700 },
    { left: 250, top: 190, size: 120, variant: 'bubble', color: orbColor, opacity: isDark ? 0.18 : 0.7, driftX: 96, driftY: 108, durationX: 3400, durationY: 2900, delay: 500 },
    { left: -20, top: 300, size: 140, variant: 'bubble', color: orbColor, opacity: isDark ? 0.14 : 0.6, driftX: 80, driftY: 92, durationX: 3900, durationY: 3300, delay: 1000 },
    { left: 160, top: 480, size: 95, variant: 'bubble', color: orbColor, opacity: isDark ? 0.18 : 0.72, driftX: 104, driftY: 90, durationX: 3000, durationY: 3600, delay: 200 },
  ];

  return (
    <Animated.View
      pointerEvents="none"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      {orbs.map((orb) => (
        <Orb {...orb} key={`orb-${orb.left}-${orb.top}-${orb.durationX}`} />
      ))}
    </Animated.View>
  );
}
