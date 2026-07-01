import { useColorScheme } from 'nativewind';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, Ellipse, FeGaussianBlur, Filter, G } from 'react-native-svg';

type BlobProps = {
  left: number;
  top: number;
  width: number;
  height: number;
  rx: number;
  ry: number;
  color: string;
  opacity: number;
  blur: number;
  driftX: number;
  driftY: number;
  duration: number;
  delay: number;
};

function Blob({
  left,
  top,
  width,
  height,
  rx,
  ry,
  color,
  opacity,
  blur,
  driftX,
  driftY,
  duration,
  delay,
}: BlobProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }), -1, true)
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: (progress.value - 0.5) * driftX * 2 },
      { translateY: (progress.value - 0.5) * driftY * 2 },
    ],
  }));

  const filterId = `bf-${left}-${top}`;
  const useFilter = Platform.OS === 'ios';

  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', left, top, width, height }, animStyle]}
    >
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {useFilter && (
          <Defs>
            <Filter id={filterId} x="-60%" y="-60%" width="220%" height="220%">
              <FeGaussianBlur stdDeviation={blur} />
            </Filter>
          </Defs>
        )}
        <G filter={useFilter ? `url(#${filterId})` : undefined} opacity={opacity}>
          <Ellipse cx={width / 2} cy={height / 2} rx={rx} ry={ry} fill={color} />
        </G>
      </Svg>
    </Animated.View>
  );
}

export default function AtmosphericBackground() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const blobColor = isDark ? '#2A2A2A' : '#B8C4B5';

  const blobs: BlobProps[] = [
    {
      left: -60,
      top: 520,
      width: 500,
      height: 380,
      rx: 220,
      ry: 170,
      color: blobColor,
      opacity: isDark ? 0.8 : 0.7,
      blur: 55,
      driftX: 8,
      driftY: 18,
      duration: 11000,
      delay: 0,
    },
    {
      left: -80,
      top: 480,
      width: 420,
      height: 340,
      rx: 190,
      ry: 155,
      color: blobColor,
      opacity: isDark ? 0.65 : 0.55,
      blur: 50,
      driftX: 14,
      driftY: 30,
      duration: 9400,
      delay: 600,
    },
    {
      left: 40,
      top: 340,
      width: 340,
      height: 300,
      rx: 150,
      ry: 130,
      color: blobColor,
      opacity: isDark ? 0.45 : 0.38,
      blur: 60,
      driftX: 20,
      driftY: 24,
      duration: 13000,
      delay: 1200,
    },
    {
      left: 100,
      top: 560,
      width: 380,
      height: 320,
      rx: 170,
      ry: 145,
      color: blobColor,
      opacity: isDark ? 0.6 : 0.5,
      blur: 52,
      driftX: 10,
      driftY: 22,
      duration: 10500,
      delay: 300,
    },
    {
      left: 80,
      top: 240,
      width: 280,
      height: 240,
      rx: 120,
      ry: 100,
      color: blobColor,
      opacity: isDark ? 0.28 : 0.22,
      blur: 65,
      driftX: 24,
      driftY: 28,
      duration: 14000,
      delay: 2000,
    },
    {
      left: 180,
      top: 620,
      width: 300,
      height: 260,
      rx: 130,
      ry: 110,
      color: blobColor,
      opacity: isDark ? 0.55 : 0.45,
      blur: 48,
      driftX: 12,
      driftY: 16,
      duration: 8800,
      delay: 800,
    },
  ];

  return (
    <Animated.View
      pointerEvents="none"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      {blobs.map((blob, i) => (
        <Blob key={i} {...blob} />
      ))}
    </Animated.View>
  );
}
