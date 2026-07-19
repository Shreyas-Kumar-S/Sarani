import React from 'react';
import { Pressable } from 'react-native';
import Animated, { interpolateColor, SharedValue, useAnimatedStyle } from 'react-native-reanimated';

type HistoryMonthChipProps = {
  label: string;
  index: number;
  itemWidth: number;
  scrollX: SharedValue<number>;
  // Where the liquid pill is currently anchored (see HistoryMonthSelector) —
  // a chip lights up if it's near either the anchor or the live scroll
  // position, since the pill visually spans both while stretching between
  // them.
  anchorX: SharedValue<number>;
  active: boolean;
  // Text color for the fully-unhighlighted end of the fade — computed by the
  // parent from the current color scheme (ink-tertiary / ink-dark-tertiary)
  // since worklets can't read nativewind's dark: classes themselves.
  inactiveTextColor: string;
  onPress: () => void;
};

const ACTIVE_TEXT = '#FFFFFF';
const PILL_HEIGHT = 32;

// Just the label — the highlight itself is a single shared "liquid" pill
// (see HistoryMonthSelector) that stretches and pops between chips, rather
// than each chip owning its own background. Only the text color fades here,
// based on how close this chip is to whichever end of the pill is nearest.
export default function HistoryMonthChip({
  label,
  index,
  itemWidth,
  scrollX,
  anchorX,
  active,
  inactiveTextColor,
  onPress,
}: HistoryMonthChipProps) {
  const textStyle = useAnimatedStyle(() => {
    const chipPos = index * itemWidth;
    const distance = Math.min(
      Math.abs(scrollX.value - chipPos),
      Math.abs(anchorX.value - chipPos)
    );
    const color = interpolateColor(distance, [0, itemWidth], [ACTIVE_TEXT, inactiveTextColor]);
    return { color };
  });

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      hitSlop={6}
      style={{
        width: itemWidth,
        height: PILL_HEIGHT,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Animated.Text className="text-[13px] font-semibold" style={textStyle}>
        {label}
      </Animated.Text>
    </Pressable>
  );
}
