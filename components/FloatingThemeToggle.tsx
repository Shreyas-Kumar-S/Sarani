import { usePathname } from 'expo-router';
import { useColorScheme } from 'nativewind';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, Text, useWindowDimensions } from 'react-native';
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
import { strings } from '@/constants/strings';

type FloatingThemeToggleProps = {
  // 0 = resting in the welcome composition (centered), 1 = docked in the corner.
  dock: SharedValue<number>;
  // How long to wait, from mount, before fading in. Defaults to the plain
  // repeat-launch delay; the root layout overrides this to line up with the
  // welcome curtain's privacy-line stage on a first-run (so this toggle isn't
  // sitting mid-way through the longer welcome paragraphs).
  introDelay?: number;
};

const SIZE = 44;
// Vertically centers the toggle on the header title's line box (BaseScreen's
// pt-2 + Header's pt-4 padding, plus half the 34px title's line height).
const CORNER_TOP = 24;
const CORNER_RIGHT = 16;

// This toggle is rendered as a sibling after <Stack> in the root layout, so it
// always paints on top of whatever screen is active — including About while
// it's still mid-transition. Reappearing the instant the route changes (before
// the native modal has actually finished sliding away, ~300-350ms) meant it
// popped in over About's own header while that was still visible/animating.
// Waiting out the dismissal first avoids that overlap.
const REAPPEAR_DELAY = 350;

// A single, persistent light/dark toggle. It mounts once (at the welcome phase) and
// never unmounts, so the same element glides from the centre of the welcome screen
// into the top-right corner of the task sheet — no cross-route handoff needed.
export default function FloatingThemeToggle({ dock, introDelay = 1200 }: FloatingThemeToggleProps) {
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();
  const { width: screenW, height: screenH } = useWindowDimensions();
  const pathname = usePathname();
  const isAbout = pathname === '/about';

  // A ref, not a dependency: the root layout computes introDelay once from
  // whichever startup path is playing (welcome vs. repeat-launch skip), and
  // this entrance should only ever run once, on mount — not retrigger if
  // that prop's identity changes later for unrelated reasons.
  const introDelayRef = useRef(introDelay);

  // Fade + pop in once introDelay has passed.
  const intro = useSharedValue(0);
  useEffect(() => {
    intro.value = withDelay(
      introDelayRef.current,
      withTiming(1, { duration: 500, easing: Easing.out(Easing.back(1.5)) })
    );
    // intro is a stable reanimated shared value, so the entrance runs once.
  }, [intro]);

  // Fades out while the About screen is open (which has no theme toggle of
  // its own) and back in when it closes. Fading rather than unmounting keeps
  // this element mounted for its whole lifetime as intended, and avoids an
  // instant snap that would fight the modal's slide transition. Reappearing
  // is additionally delayed (see REAPPEAR_DELAY) so it doesn't fade in while
  // About is still visually sliding away.
  const aboutVisibility = useSharedValue(isAbout ? 0 : 1);
  const [canInteract, setCanInteract] = useState(!isAbout);
  useEffect(() => {
    if (isAbout) {
      aboutVisibility.value = withTiming(0, { duration: 200, easing: Easing.out(Easing.cubic) });
      setCanInteract(false);
      return;
    }

    aboutVisibility.value = withDelay(
      REAPPEAR_DELAY,
      withTiming(1, { duration: 200, easing: Easing.out(Easing.cubic) })
    );
    const timer = setTimeout(() => setCanInteract(true), REAPPEAR_DELAY);
    return () => clearTimeout(timer);
  }, [isAbout, aboutVisibility]);

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
      opacity: intro.value * aboutVisibility.value,
      transform: [{ translateX }, { translateY }, { scale: dockScale * introScale }],
    };
  });

  return (
    <Animated.View
      pointerEvents={canInteract ? 'auto' : 'none'}
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
      <Pressable
        onPress={toggleColorScheme}
        style={({ pressed }) => (pressed ? { opacity: 0.6 } : null)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={strings.a11y.toggleTheme}
      >
        <Text style={{ fontSize: 14 }}>{colorScheme === 'dark' ? '🌙' : '☀️'}</Text>
      </Pressable>
    </Animated.View>
  );
}
