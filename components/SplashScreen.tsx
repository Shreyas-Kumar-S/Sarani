import React, { useEffect, useRef } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { useColorScheme } from 'nativewind';
import { SplashLogoLight, SplashLogoDark } from './Splashlogo';

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const { colorScheme } = useColorScheme();
  const containerOpacity = useSharedValue(1);
  const onFinishRef = useRef(onFinish);

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  useEffect(() => {
    containerOpacity.value = withDelay(
      3200,
      withTiming(0, { duration: 500 }, (finished) => {
        if (finished) {
          runOnJS(onFinishRef.current)();
        }
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  return (
    <Animated.View
      style={[{ flex: 1 }, animatedStyle]}
      className="items-center justify-center bg-surface-page dark:bg-surface-dark-page"
    >
      {colorScheme === 'dark' ? (
        <SplashLogoDark width={350} height={350} />
      ) : (
        <SplashLogoLight width={350} height={350} />
      )}
    </Animated.View>
  );
}
