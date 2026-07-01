import { useColorScheme } from 'nativewind';
import React, { useEffect } from 'react';
import { Text, TouchableOpacity, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type FloatingThemeToggleProps = {
  // 0 = resting in the welcome composition (centered), 1 = docked in the corner.
  dock: SharedValue<number>;
};

const SIZE = 44;
const CORNER_TOP = 6;
const CORNER_RIGHT = 16;

// A single, persistent light/dark toggle. It mounts once (at the welcome phase) and
// never unmounts, so the same element glides from the centre of the welcome screen
// into the top-right corner of the task sheet — no cross-route handoff needed.
export default function FloatingThemeToggle({ dock }: FloatingThemeToggleProps) {
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();
  const { width: screenW, height: screenH } = useWindowDimensions();

  // Fade + pop in on the welcome screen, matching the curtain's staggered entrance.
  const intro = useSharedValue(0);
  useEffect(() => {
    intro.value = withDelay(
      1200,
      withTiming(1, { duration: 500, easing: Easing.out(Easing.back(1.5)) })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resting (docked) centre vs. welcome centre — the delta is how far it travels.
  const dockedCenterX = screenW - CORNER_RIGHT - SIZE / 2;
  const dockedCenterY = insets.top + CORNER_TOP + SIZE / 2;
  const welcomeOffsetX = screenW / 2 - dockedCenterX;
  const welcomeOffsetY = screenH * 0.62 - dockedCenterY;

  const style = useAnimatedStyle(() => {
    const translateX = interpolate(dock.value, [0, 1], [welcomeOffsetX, 0]);
    const translateY = interpolate(dock.value, [0, 1], [welcomeOffsetY, 0]);
    const dockScale = interpolate(dock.value, [0, 1], [1.15, 1]);
    const introScale = interpolate(intro.value, [0, 1], [0.9, 1]);
    return {
      opacity: intro.value,
      transform: [{ translateX }, { translateY }, { scale: dockScale * introScale }],
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: insets.top + CORNER_TOP,
          right: CORNER_RIGHT,
          width: SIZE,
          height: SIZE,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <TouchableOpacity
        onPress={toggleColorScheme}
        activeOpacity={0.6}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Toggle color theme"
      >
        <Text style={{ fontSize: 24 }}>{colorScheme === 'dark' ? '🌙' : '☀️'}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}
