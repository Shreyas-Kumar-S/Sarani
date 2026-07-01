import React, { useCallback, useEffect } from 'react';
import { Dimensions, Platform } from 'react-native';
import { useColorScheme } from 'nativewind';
import Svg, { Defs, Filter, FeGaussianBlur, G, Ellipse } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

const { width: SW, height: SH } = Dimensions.get('window');

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

type BlobConfig = {
  startX: number;
  startY: number;
  width: number;
  height: number;
  rx: number;
  ry: number;
  color: string;
  opacity: number;
  blur: number;
  roamX: number;
  roamY: number;
  baseDuration: number;
  index: number;
};

function Blob({
  startX,
  startY,
  width,
  height,
  rx,
  ry,
  color,
  opacity,
  blur,
  roamX,
  roamY,
  baseDuration,
  index,
}: BlobConfig) {
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);

  const filterId = `bf-${index}`;
  const useFilter = Platform.OS === 'ios';

  const wander = useCallback(() => {
    const nextX = rand(-roamX, roamX);
    const nextY = rand(-roamY, roamY);
    const dur = rand(baseDuration * 0.75, baseDuration * 1.25);

    tx.value = withTiming(nextX, { duration: dur, easing: Easing.inOut(Easing.sin) }, (done) => {
      if (done) runOnJS(wander)();
    });
    ty.value = withTiming(nextY, {
      duration: rand(baseDuration * 0.6, baseDuration * 1.1),
      easing: Easing.inOut(Easing.sin),
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(wander, rand(0, 1500));
    return () => clearTimeout(timer);
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', left: startX, top: startY, width, height }, animStyle]}
    >
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {useFilter && (
          <Defs>
            <Filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
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
  const color = isDark ? '#2A2A2A' : '#B8C4B5';

  const blobs: Omit<BlobConfig, 'index'>[] = [
    {
      startX: SW * 0.1,
      startY: SH * 0.1,
      width: 320,
      height: 280,
      rx: 145,
      ry: 125,
      color,
      opacity: isDark ? 0.6 : 0.5,
      blur: 52,
      roamX: SW * 0.45,
      roamY: SH * 0.35,
      baseDuration: 9000,
    },
    {
      startX: SW * 0.25,
      startY: SH * 0.4,
      width: 360,
      height: 300,
      rx: 165,
      ry: 140,
      color,
      opacity: isDark ? 0.7 : 0.6,
      blur: 58,
      roamX: SW * 0.4,
      roamY: SH * 0.4,
      baseDuration: 11000,
    },
    {
      startX: SW * 0.0,
      startY: SH * 0.55,
      width: 300,
      height: 260,
      rx: 135,
      ry: 115,
      color,
      opacity: isDark ? 0.55 : 0.45,
      blur: 48,
      roamX: SW * 0.5,
      roamY: SH * 0.3,
      baseDuration: 10000,
    },
  ];

  return (
    <Animated.View
      pointerEvents="none"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      {blobs.map((blob, i) => (
        <Blob key={i} {...blob} index={i} />
      ))}
    </Animated.View>
  );
}
