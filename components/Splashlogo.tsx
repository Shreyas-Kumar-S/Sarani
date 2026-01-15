import React, { useEffect } from 'react';
import Animated, {
    Easing,
    useAnimatedProps,
    useSharedValue,
    withDelay,
    withTiming,
} from 'react-native-reanimated';
import Svg, { Path, Rect, Text as SvgText } from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedSvgText = Animated.createAnimatedComponent(SvgText);

interface SplashLogoProps {
  width?: number;
  height?: number;
}

// Light Mode Version
export function SplashLogoLight({ width = 250, height = 250 }: SplashLogoProps) {
  const strokeDashoffset = useSharedValue(1);
  const strokeWidth = useSharedValue(60);
  const textOpacity = useSharedValue(0);
  const taglineOpacity = useSharedValue(0);

  useEffect(() => {
    // Path drawing animation
    strokeDashoffset.value = withDelay(
      200,
      withTiming(0, {
        duration: 1900,
        easing: Easing.bezier(0.45, 0, 0.25, 1),
      })
    );

    // Stroke width animation
    strokeWidth.value = withDelay(
      900,
      withTiming(66, {
        duration: 1200,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      })
    );

    // App name fade in
    textOpacity.value = withDelay(
      1600,
      withTiming(1, { duration: 900 })
    );

    // Tagline fade in
    taglineOpacity.value = withDelay(
      2100,
      withTiming(1, { duration: 1000 })
    );
  }, []);

  const pathAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset: strokeDashoffset.value,
    strokeWidth: strokeWidth.value,
  }));

  const textAnimatedProps = useAnimatedProps(() => ({
    opacity: textOpacity.value,
  }));

  const taglineAnimatedProps = useAnimatedProps(() => ({
    opacity: taglineOpacity.value,
  }));

  return (
    <Svg width={width} height={height} viewBox="0 0 1024 1024">
      {/* Background - Light Mode */}
      <Rect width="1024" height="1024" rx="220" fill="#FAF8F5" />
      
      {/* Calligraphic S - Light Mode */}
      <AnimatedPath
        d="M660 320 C600 260 460 270 430 350 C400 430 540 460 610 495 C690 535 715 610 670 675 C625 740 485 755 380 700"
        fill="none"
        stroke="#7A9B76"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="1"
        animatedProps={pathAnimatedProps}
      />
      
      {/* App name - Light Mode */}
      <AnimatedSvgText
        x="512"
        y="850"
        textAnchor="middle"
        fontSize="68"
        fill="#3A3A3A"
        fontFamily="system-ui"
        letterSpacing="1"
        animatedProps={textAnimatedProps}
      >
        Serein
      </AnimatedSvgText>
      
      {/* Tagline - Light Mode */}
      <AnimatedSvgText
        x="512"
        y="910"
        textAnchor="middle"
        fontSize="34"
        fill="#7A9B76"
        fontFamily="system-ui"
        animatedProps={taglineAnimatedProps}
      >
        Move Gently Forward
      </AnimatedSvgText>
    </Svg>
  );
}

// Dark Mode Version
export function SplashLogoDark({ width = 250, height = 250 }: SplashLogoProps) {
  const strokeDashoffset = useSharedValue(1);
  const strokeWidth = useSharedValue(60);
  const textOpacity = useSharedValue(0);
  const taglineOpacity = useSharedValue(0);

  useEffect(() => {
    // Path drawing animation
    strokeDashoffset.value = withDelay(
      200,
      withTiming(0, {
        duration: 1900,
        easing: Easing.bezier(0.45, 0, 0.25, 1),
      })
    );

    // Stroke width animation
    strokeWidth.value = withDelay(
      900,
      withTiming(66, {
        duration: 1200,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      })
    );

    // App name fade in
    textOpacity.value = withDelay(
      1600,
      withTiming(1, { duration: 900 })
    );

    // Tagline fade in
    taglineOpacity.value = withDelay(
      2100,
      withTiming(1, { duration: 1000 })
    );
  }, []);

  const pathAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset: strokeDashoffset.value,
    strokeWidth: strokeWidth.value,
  }));

  const textAnimatedProps = useAnimatedProps(() => ({
    opacity: textOpacity.value,
  }));

  const taglineAnimatedProps = useAnimatedProps(() => ({
    opacity: taglineOpacity.value,
  }));

  return (
    <Svg width={width} height={height} viewBox="0 0 1024 1024">
      {/* Background - Dark Mode */}
      <Rect width="1024" height="1024" rx="220" fill="#141918" />
      
      {/* Calligraphic S - Dark Mode */}
      <AnimatedPath
        d="M660 320 C600 260 460 270 430 350 C400 430 540 460 610 495 C690 535 715 610 670 675 C625 740 485 755 380 700"
        fill="none"
        stroke="#9DB7B1"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="1"
        animatedProps={pathAnimatedProps}
      />
      
      {/* App name - Dark Mode */}
      <AnimatedSvgText
        x="512"
        y="850"
        textAnchor="middle"
        fontSize="68"
        fill="#D6E2DE"
        fontFamily="system-ui"
        letterSpacing="1"
        animatedProps={textAnimatedProps}
      >
        Serein
      </AnimatedSvgText>
      
      {/* Tagline - Dark Mode */}
      <AnimatedSvgText
        x="512"
        y="910"
        textAnchor="middle"
        fontSize="34"
        fill="#9DB7B1"
        fontFamily="system-ui"
        animatedProps={taglineAnimatedProps}
      >
        Move Gently Forward
      </AnimatedSvgText>
    </Svg>
  );
}