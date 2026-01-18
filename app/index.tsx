import { useColorScheme } from 'nativewind';
import React, { useEffect } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

export default function Index() {
  const { colorScheme, toggleColorScheme } = useColorScheme();

  // Animation values
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(20);

  const taglineOpacity = useSharedValue(0);
  const taglineTranslateY = useSharedValue(20);

  const descriptionOpacity = useSharedValue(0);
  const descriptionTranslateY = useSharedValue(20);

  const buttonOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(0.9);

  useEffect(() => {
    titleOpacity.value = withTiming(1, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
    titleTranslateY.value = withTiming(0, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });

    taglineOpacity.value = withDelay(
      400,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) })
    );
    taglineTranslateY.value = withDelay(
      400,
      withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) })
    );

    descriptionOpacity.value = withDelay(
      800,
      withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) })
    );
    descriptionTranslateY.value = withDelay(
      800,
      withTiming(0, { duration: 700, easing: Easing.out(Easing.cubic) })
    );

    buttonOpacity.value = withDelay(
      1200,
      withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) })
    );
    buttonScale.value = withDelay(
      1200,
      withTiming(1, { duration: 500, easing: Easing.out(Easing.back(1.5)) })
    );
  }, []);

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const taglineAnimatedStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
    transform: [{ translateY: taglineTranslateY.value }],
  }));

  const descriptionAnimatedStyle = useAnimatedStyle(() => ({
    opacity: descriptionOpacity.value,
    transform: [{ translateY: descriptionTranslateY.value }],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ scale: buttonScale.value }],
  }));

  return (
    <View className="flex-1 items-center justify-center bg-surface-page dark:bg-surface-dark-page px-8">
      {/* Title */}
      <Animated.View style={titleAnimatedStyle} className="items-center mb-3">
        <Text className="text-4xl font-bold text-ink-primary dark:text-ink-dark-primary text-center">
          Welcome to Serein
        </Text>
      </Animated.View>

      <Animated.View style={taglineAnimatedStyle} className="items-center mb-8">
        <Text className="text-xs text-ink-quaternary dark:text-ink-dark-quaternary uppercase tracking-widest text-center">
          Move Gently Forward
        </Text>
      </Animated.View>

      <Animated.View style={descriptionAnimatedStyle} className="mb-10">
        <Text className="text-base text-ink-secondary dark:text-ink-dark-secondary text-center max-w-sm leading-7">
          This is a quiet space for your intentions, kept on your device and available offline.
          There's nothing to keep up with here. Take things as they come.
        </Text>
      </Animated.View>

      <Animated.View style={buttonAnimatedStyle} className="mt-2">
        <TouchableOpacity
          onPress={toggleColorScheme}
          activeOpacity={0.6}
          accessibilityRole="button"
          accessibilityLabel="Toggle color theme"
        >
          <Text className="text-xl text-ink-quaternary dark:text-ink-dark-quaternary">
            {colorScheme === 'dark' ? '🌙' : '☀️'}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}
