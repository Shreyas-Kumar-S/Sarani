import { useColorScheme } from "nativewind";
import React, { useEffect } from "react";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { SplashLogoDark, SplashLogoLight } from "./Splashlogo";

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const { colorScheme } = useColorScheme();
  const containerOpacity = useSharedValue(1);

  useEffect(() => {
    // Fade out the entire splash screen after animations complete
    containerOpacity.value = withDelay(
      3200, // Wait for all animations to finish
      withTiming(0, { duration: 500 }, (finished) => {
        if (finished) {
          runOnJS(onFinish)();
        }
      })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  return (
    <Animated.View
      style={[{ flex: 1 }, animatedStyle]}
      className="items-center justify-center bg-surface-page dark:bg-surface-dark-page"
    >
      {colorScheme === "dark" ? (
        <SplashLogoDark width={300} height={300} />
      ) : (
        <SplashLogoLight width={300} height={300} />
      )}
    </Animated.View>
  );
}
