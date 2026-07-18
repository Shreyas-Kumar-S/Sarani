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

// Calculated path length - this needs to match the actual SVG path length
const PATH_LENGTH = 1090;

// Light Mode Version
export const SplashLogoLight: React.FC<SplashLogoProps> = ({ width = 350, height = 350 }) => {
  const progress = useSharedValue(0);
  const strokeWidth = useSharedValue(60);
  const textOpacity = useSharedValue(0);
  const taglineOpacity = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      200,
      withTiming(1, {
        duration: 1900,
        easing: Easing.bezier(0.45, 0, 0.25, 1),
      })
    );

    strokeWidth.value = withDelay(
      900,
      withTiming(66, {
        duration: 1200,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      })
    );

    textOpacity.value = withDelay(1600, withTiming(1, { duration: 900 }));
    taglineOpacity.value = withDelay(2100, withTiming(1, { duration: 1000 }));

    // All are stable reanimated shared values, so the draw-in runs once.
  }, [progress, strokeWidth, textOpacity, taglineOpacity]);

  const pathAnimatedProps = useAnimatedProps(() => {
    const strokeDashoffset = PATH_LENGTH * (1 - progress.value);
    return {
      strokeDashoffset,
      strokeWidth: strokeWidth.value,
    };
  });

  const textAnimatedProps = useAnimatedProps(() => ({
    opacity: textOpacity.value,
  }));

  const taglineAnimatedProps = useAnimatedProps(() => ({
    opacity: taglineOpacity.value,
  }));

  return (
    <Svg width={width} height={height} viewBox="0 0 1024 1024" preserveAspectRatio="xMidYMid meet">
      <Rect width="1024" height="1024" rx="220" fill="#FAF8F5" />
      <AnimatedPath
        d="M660 320 C600 260 460 270 430 350 C400 430 540 460 610 495 C690 535 715 610 670 675 C625 740 485 755 380 700"
        fill="none"
        stroke="#7A9B76"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={`${PATH_LENGTH} ${PATH_LENGTH}`}
        animatedProps={pathAnimatedProps}
      />
      <AnimatedSvgText
        x="512"
        y="844"
        textAnchor="middle"
        fontSize="104"
        fill="#6F8580"
        fontFamily="Georgia"
        letterSpacing="2"
        animatedProps={textAnimatedProps}
      >
        Serein
      </AnimatedSvgText>
      <AnimatedSvgText
        x="512"
        y="875"
        textAnchor="middle"
        fontSize="32"
        fill="#6F8580"
        fontFamily="Georgia"
        animatedProps={taglineAnimatedProps}
      >
        move gently forward
      </AnimatedSvgText>
    </Svg>
  );
};

export const SplashLogoDark: React.FC<SplashLogoProps> = ({ width = 350, height = 350 }) => {
  const progress = useSharedValue(0);
  const strokeWidth = useSharedValue(60);
  const textOpacity = useSharedValue(0);
  const taglineOpacity = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      200,
      withTiming(1, {
        duration: 1900,
        easing: Easing.bezier(0.45, 0, 0.25, 1),
      })
    );

    strokeWidth.value = withDelay(
      900,
      withTiming(66, {
        duration: 1200,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      })
    );

    textOpacity.value = withDelay(1600, withTiming(1, { duration: 900 }));
    taglineOpacity.value = withDelay(2100, withTiming(1, { duration: 1000 }));

    // All are stable reanimated shared values, so the draw-in runs once.
  }, [progress, strokeWidth, textOpacity, taglineOpacity]);
  const pathAnimatedProps = useAnimatedProps(() => {
    const strokeDashoffset = PATH_LENGTH * (1 - progress.value);
    return {
      strokeDashoffset,
      strokeWidth: strokeWidth.value,
    };
  });

  const textAnimatedProps = useAnimatedProps(() => ({
    opacity: textOpacity.value,
  }));

  const taglineAnimatedProps = useAnimatedProps(() => ({
    opacity: taglineOpacity.value,
  }));

  return (
    <Svg width={width} height={height} viewBox="0 0 1024 1024" preserveAspectRatio="xMidYMid meet">
      <Rect width="1024" height="1024" rx="220" fill="#141918" />
      <AnimatedPath
        d="M660 320 C600 260 460 270 430 350 C400 430 540 460 610 495 C690 535 715 610 670 675 C625 740 485 755 380 700"
        fill="none"
        stroke="#9DB7B1"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={`${PATH_LENGTH} ${PATH_LENGTH}`}
        animatedProps={pathAnimatedProps}
      />
      <AnimatedSvgText
        x="512"
        y="844"
        textAnchor="middle"
        fontSize="104"
        fill="#D6E2DE"
        fontFamily="Georgia"
        letterSpacing="2"
        animatedProps={textAnimatedProps}
      >
        Serein
      </AnimatedSvgText>
      <AnimatedSvgText
        x="512"
        y="895"
        textAnchor="middle"
        fontSize="32"
        fill="#9DB7B1"
        fontFamily="Georgia"
        animatedProps={taglineAnimatedProps}
      >
        move gently forward
      </AnimatedSvgText>
    </Svg>
  );
};
