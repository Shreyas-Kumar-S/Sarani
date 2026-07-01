import React, { useEffect } from 'react';
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
};

const ENTER = { duration: 800, easing: Easing.out(Easing.cubic) };

// The welcome content (title / tagline / description) shown over the already-mounted
// tabs. It runs its own staggered entrance, then the root layout fades it away.
// The sun/moon toggle is intentionally NOT here — it lives in FloatingThemeToggle so
// it can persist and glide into the corner as this curtain dissolves.
export default function WelcomeCurtain({ curtainOpacity }: WelcomeCurtainProps) {
  const titleOpacity = useSharedValue(0);
  const titleY = useSharedValue(20);
  const taglineOpacity = useSharedValue(0);
  const taglineY = useSharedValue(20);
  const descriptionOpacity = useSharedValue(0);
  const descriptionY = useSharedValue(20);

  useEffect(() => {
    titleOpacity.value = withTiming(1, ENTER);
    titleY.value = withTiming(0, ENTER);
    taglineOpacity.value = withDelay(400, withTiming(1, { ...ENTER, duration: 600 }));
    taglineY.value = withDelay(400, withTiming(0, { ...ENTER, duration: 600 }));
    descriptionOpacity.value = withDelay(800, withTiming(1, { ...ENTER, duration: 700 }));
    descriptionY.value = withDelay(800, withTiming(0, { ...ENTER, duration: 700 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const containerStyle = useAnimatedStyle(() => ({ opacity: curtainOpacity.value }));
  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleY.value }],
  }));
  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
    transform: [{ translateY: taglineY.value }],
  }));
  const descriptionStyle = useAnimatedStyle(() => ({
    opacity: descriptionOpacity.value,
    transform: [{ translateY: descriptionY.value }],
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

      <Animated.View style={descriptionStyle} className="mb-10">
        <Text className="text-base leading-7 text-center max-w-sm text-ink-secondary dark:text-ink-dark-secondary">
          {strings.welcome.description}
        </Text>
      </Animated.View>
    </Animated.View>
  );
}
