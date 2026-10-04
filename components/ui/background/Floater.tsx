import React, { ReactNode, useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useFrameCallback,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { valueNoise } from './noise';

export type FloaterMotion = {
  /**
   * `loop`: an eased sway between two points on each axis, the same figure
   * every cycle. `wander`: noise-driven drift that never repeats. Both stay
   * within the drift radius.
   */
  motion?: 'loop' | 'wander';
  /** Half-amplitude of the horizontal drift, in dp. */
  driftX: number;
  /** Half-amplitude of the vertical drift, in dp. */
  driftY: number;
  /** Loop: one leg of the sway. Wander: roughly how often direction changes. */
  durationX: number;
  durationY: number;
  delay: number;
};

type FloaterProps = FloaterMotion & {
  left: number;
  top: number;
  /** Side of the square box the child is drawn into, in dp. */
  size: number;
  children: ReactNode;
};

// The mover. It owns position, size and motion, and draws whatever it is
// given inside that box. It deliberately knows nothing about the child:
// no colour, no opacity, no kind. That is what lets the background swap
// bubbles for other shapes without touching how anything moves.
//
// Both motions drive the same two progress values in [0, 1], so the
// transform below is shared: 0.5 is the resting spot, and the breathing
// scale rides on the horizontal progress. Everything runs on the UI thread.
export function Floater({
  left,
  top,
  size,
  motion = 'loop',
  driftX,
  driftY,
  durationX,
  durationY,
  delay,
  children,
}: FloaterProps) {
  const reduceMotion = useReducedMotion();
  const wandering = motion === 'wander' && !reduceMotion;
  // The loop starts from 0 so its reverse leg returns to 0; wander and
  // still both rest at the centre.
  const px = useSharedValue(motion === 'loop' ? 0 : 0.5);
  const py = useSharedValue(motion === 'loop' ? 0 : 0.5);
  // Fresh seeds per mount, so each launch wanders differently. Seeded in the
  // effect (not during render, which must stay pure) and kept on shared
  // values so the UI-thread frame callback can read them.
  const seedX = useSharedValue(0);
  const seedY = useSharedValue(0);

  useEffect(() => {
    if (wandering) {
      seedX.value = Math.random() * 1000;
      seedY.value = Math.random() * 1000;
      return; // the frame callback below owns px/py
    }
    if (reduceMotion) {
      px.value = 0.5;
      py.value = 0.5;
      return;
    }
    px.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: durationX, easing: Easing.inOut(Easing.sin) }), -1, true)
    );
    py.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: durationY, easing: Easing.inOut(Easing.sin) }), -1, true)
    );
  }, [px, py, seedX, seedY, durationX, durationY, delay, wandering, reduceMotion]);

  useFrameCallback((frame) => {
    const t = frame.timeSinceFirstFrame;
    px.value = 0.5 + 0.5 * valueNoise(t / durationX, seedX.value);
    py.value = 0.5 + 0.5 * valueNoise(t / durationY, seedY.value);
  }, wandering);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: (px.value - 0.5) * driftX * 2 },
      { translateY: (py.value - 0.5) * driftY * 2 },
      { scale: 0.92 + px.value * 0.16 },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', left, top, width: size, height: size }, animStyle]}
    >
      {children}
    </Animated.View>
  );
}
