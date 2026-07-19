import { Feather } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { strings } from '@/constants/strings';

// Matches FloatingThemeToggle's own geometry (SIZE 44, CORNER_TOP 24,
// CORNER_RIGHT 16) so this button sits immediately to its left with a fixed
// 8px gap, vertically centered against it — rather than living in a screen's
// own Header row, where it previously fought for space with the title text
// and wrapped/overlapped on narrower screens.
const TOGGLE_SIZE = 44;
const TOGGLE_CORNER_TOP = 24;
const TOGGLE_CORNER_RIGHT = 16;
const GAP = 8;

const SIZE = 32;
const CORNER_TOP = TOGGLE_CORNER_TOP + (TOGGLE_SIZE - SIZE) / 2;
const CORNER_RIGHT = TOGGLE_CORNER_RIGHT + TOGGLE_SIZE + GAP;

const FADE_DURATION = 200;
// This button is rendered as a sibling after <Stack> in the root layout, so it
// always paints on top of whatever screen is active — including About while
// it's still mid-transition. Reappearing the instant the route changes (before
// the native modal has actually finished sliding away, ~300-350ms) meant this
// button's fade-in double-exposed against About's own close button in the same
// corner. Waiting out the dismissal first avoids that overlap.
const REAPPEAR_DELAY = 350;

// A single, persistent "About" affordance, floating next to the theme toggle
// on every screen. It fades out (rather than unmounting) while the About
// screen is open — About has its own close button in this slot — so it
// doesn't snap away mid-transition and fight the modal's slide animation.
export default function InfoButton() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const isAbout = pathname === '/about';

  const visibility = useSharedValue(isAbout ? 0 : 1);
  const [canInteract, setCanInteract] = useState(!isAbout);

  useEffect(() => {
    if (isAbout) {
      visibility.value = withTiming(0, {
        duration: FADE_DURATION,
        easing: Easing.out(Easing.cubic),
      });
      setCanInteract(false);
      return;
    }

    visibility.value = withDelay(
      REAPPEAR_DELAY,
      withTiming(1, { duration: FADE_DURATION, easing: Easing.out(Easing.cubic) })
    );
    const timer = setTimeout(() => setCanInteract(true), REAPPEAR_DELAY);
    return () => clearTimeout(timer);
  }, [isAbout, visibility]);

  const style = useAnimatedStyle(() => ({ opacity: visibility.value }));

  return (
    // Absolute positioning lives on this plain wrapping View (a static style
    // object) rather than on the Pressable itself — combining a function-form
    // `style` (needed for the pressed-state feedback) with a `className` on
    // the same element was silently dropping the position/top/right styles.
    <Animated.View
      pointerEvents={canInteract ? 'auto' : 'none'}
      style={[
        {
          position: 'absolute',
          top: insets.top + CORNER_TOP,
          right: CORNER_RIGHT,
          width: SIZE,
          height: SIZE,
        },
        style,
      ]}
    >
      <Pressable
        onPress={() => router.push('/about')}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={strings.a11y.openAbout}
        style={({ pressed }) => (pressed ? { opacity: 0.6 } : null)}
        className="h-full w-full items-center justify-center rounded-full bg-primary/15"
      >
        <Feather name="info" size={16} color="#7A9B76" />
      </Pressable>
    </Animated.View>
  );
}
