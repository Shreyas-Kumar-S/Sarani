import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  Easing,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { strings } from '@/constants/strings';

type WelcomeCurtainProps = {
  // Owned by the root layout; driven to 0 to fade the curtain and reveal the tabs.
  curtainOpacity: SharedValue<number>;
  // Called once this curtain's own sequence (welcome content, then the privacy
  // line) has fully played out — the root layout only starts its own exit
  // choreography (docking the toggle, fading the curtain) at that point.
  onSequenceComplete?: () => void;
};

const ENTER = { duration: 800, easing: Easing.out(Easing.cubic) };

// Stage timing, in ms from mount. The welcome content (title/tagline/
// description) enters staggered, holds, then lets go — fading to an empty
// curtain — before the privacy line has the screen to itself.
const TAGLINE_DELAY = 400;
const DESCRIPTION_DELAY = 800;
const DESCRIPTION_ENTER_DURATION = 700;
const CONTENT_HOLD_MS = 1600;
const CONTENT_EXIT_MS = 500;
const EMPTY_PAUSE_MS = 400;
const PRIVACY_ENTER_MS = 700;
const PRIVACY_HOLD_MS = 2000;

const CONTENT_EXIT_AT = DESCRIPTION_DELAY + DESCRIPTION_ENTER_DURATION + CONTENT_HOLD_MS;
// Exported so FloatingThemeToggle can delay its own entrance to match — it's
// pinned to a fixed screen position meant to sit below whatever's currently
// showing, so it shouldn't appear until the (much shorter) privacy line has
// replaced the welcome content, rather than overlapping the longer paragraphs.
export const PRIVACY_ENTER_AT = CONTENT_EXIT_AT + CONTENT_EXIT_MS + EMPTY_PAUSE_MS;
const SEQUENCE_DONE_AT = PRIVACY_ENTER_AT + PRIVACY_ENTER_MS + PRIVACY_HOLD_MS;

// The welcome content (title / tagline / description) shown over the already-mounted
// tabs. It runs its own staggered entrance, holds, fades to empty, then reveals a
// short privacy line alone — before handing off to the root layout's own exit
// choreography. The sun/moon toggle is intentionally NOT here — it lives in
// FloatingThemeToggle so it can persist and glide into the corner as this curtain
// dissolves.
export default function WelcomeCurtain({
  curtainOpacity,
  onSequenceComplete,
}: WelcomeCurtainProps) {
  const titleOpacity = useSharedValue(0);
  const titleY = useSharedValue(20);
  const taglineOpacity = useSharedValue(0);
  const taglineY = useSharedValue(20);
  const descriptionOpacity = useSharedValue(0);
  const descriptionY = useSharedValue(20);
  // Multiplies into the three above so one fade-to-empty covers all of them,
  // rather than re-animating each one's own opacity a second time.
  const contentOpacity = useSharedValue(1);
  const privacyOpacity = useSharedValue(0);
  const privacyY = useSharedValue(16);

  // A ref, not a dependency: onSequenceComplete may be a fresh function each
  // render (it closes over the parent's shared values), but the timer chain
  // below must only ever run once, on mount.
  const onSequenceCompleteRef = useRef(onSequenceComplete);
  useEffect(() => {
    onSequenceCompleteRef.current = onSequenceComplete;
  }, [onSequenceComplete]);

  useEffect(() => {
    titleOpacity.value = withTiming(1, ENTER);
    titleY.value = withTiming(0, ENTER);
    taglineOpacity.value = withDelay(TAGLINE_DELAY, withTiming(1, { ...ENTER, duration: 600 }));
    taglineY.value = withDelay(TAGLINE_DELAY, withTiming(0, { ...ENTER, duration: 600 }));
    descriptionOpacity.value = withDelay(
      DESCRIPTION_DELAY,
      withTiming(1, { ...ENTER, duration: DESCRIPTION_ENTER_DURATION })
    );
    descriptionY.value = withDelay(
      DESCRIPTION_DELAY,
      withTiming(0, { ...ENTER, duration: DESCRIPTION_ENTER_DURATION })
    );

    const timers: ReturnType<typeof setTimeout>[] = [];

    // Let the welcome content go — fade it to empty before the privacy line
    // takes its place, rather than cross-fading the two.
    timers.push(
      setTimeout(() => {
        contentOpacity.value = withTiming(0, {
          duration: CONTENT_EXIT_MS,
          easing: Easing.out(Easing.cubic),
        });
      }, CONTENT_EXIT_AT)
    );

    // After a brief empty beat, the privacy promise appears alone.
    timers.push(
      setTimeout(() => {
        privacyOpacity.value = withTiming(1, {
          duration: PRIVACY_ENTER_MS,
          easing: Easing.out(Easing.cubic),
        });
        privacyY.value = withTiming(0, {
          duration: PRIVACY_ENTER_MS,
          easing: Easing.out(Easing.cubic),
        });
      }, PRIVACY_ENTER_AT)
    );

    // Hand off to the root layout's own exit choreography once the privacy
    // line has had time to be read.
    timers.push(
      setTimeout(() => {
        onSequenceCompleteRef.current?.();
      }, SEQUENCE_DONE_AT)
    );

    return () => timers.forEach(clearTimeout);
    // All shared values are stable, so this sequence runs exactly once.
  }, [
    titleOpacity,
    titleY,
    taglineOpacity,
    taglineY,
    descriptionOpacity,
    descriptionY,
    contentOpacity,
    privacyOpacity,
    privacyY,
  ]);

  const containerStyle = useAnimatedStyle(() => ({ opacity: curtainOpacity.value }));
  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value * contentOpacity.value,
    transform: [{ translateY: titleY.value }],
  }));
  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value * contentOpacity.value,
    transform: [{ translateY: taglineY.value }],
  }));
  const descriptionStyle = useAnimatedStyle(() => ({
    opacity: descriptionOpacity.value * contentOpacity.value,
    transform: [{ translateY: descriptionY.value }],
  }));
  const privacyStyle = useAnimatedStyle(() => ({
    opacity: privacyOpacity.value,
    transform: [{ translateY: privacyY.value }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, containerStyle]}
      className="items-center justify-center bg-surface-page dark:bg-surface-dark-page px-8"
    >
      <Animated.View style={titleStyle} className="items-center mb-3">
        <Text className="text-4xl font-bold text-ink-primary dark:text-ink-dark-primary text-center">
          {strings.welcome.title}
        </Text>
      </Animated.View>

      <Animated.View style={taglineStyle} className="items-center mb-8">
        <Text className="text-xs uppercase tracking-widest text-center text-ink-quaternary dark:text-ink-dark-quaternary">
          {strings.welcome.tagline}
        </Text>
      </Animated.View>

      <Animated.View style={descriptionStyle} className="mb-10 max-w-sm">
        {strings.welcome.description.map((paragraph, index) => (
          <Text
            key={index}
            style={{
              marginBottom: index < strings.welcome.description.length - 1 ? 16 : 0,
            }}
            className="text-base leading-7 text-center text-ink-secondary dark:text-ink-dark-secondary"
          >
            {paragraph}
          </Text>
        ))}
      </Animated.View>

      <Animated.View
        style={[StyleSheet.absoluteFill, privacyStyle]}
        className="items-center justify-center px-8"
      >
        <Text className="font-serif text-[19px] leading-7 text-center max-w-xs text-ink-primary dark:text-ink-dark-primary">
          {strings.welcome.privacyPromise}
        </Text>
      </Animated.View>
    </Animated.View>
  );
}
