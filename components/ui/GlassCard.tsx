import { BlurView } from 'expo-blur';
import { useColorScheme } from 'nativewind';
import React, { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

type GlassCardProps = {
  children: ReactNode;
  // Applied to the inner content wrapper — use for padding (e.g. "px-5 py-6").
  className?: string;
};

// A frosted-glass surface: a real blur of whatever drifts behind it (the
// atmospheric bubbles) plus a semi-opaque tint so text stays fully readable.
// Shadow lives on the outer view; the inner view clips the blur to the radius.
export default function GlassCard({ children, className = '' }: GlassCardProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View
      className="rounded-[28px]"
      style={{ boxShadow: isDark ? '0px 8px 22px rgba(0, 0, 0, 0.7)' : '0px 8px 22px rgba(0,0,0,0.13)' }}
    >
      <View className="overflow-hidden rounded-[28px] border border-black/[0.12] dark:border-white/10">
        <BlurView
          experimentalBlurMethod="dimezisBlurView"
          intensity={isDark ? 20 : 42}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
        {/* Tint over the blur. Dark mode leans near-black (the blur material is
            grey, so a light tint reads grey); light mode stays sheer glass. */}
        <View
          style={StyleSheet.absoluteFill}
          className={isDark ? 'bg-black/65' : 'bg-white/12'}
        />
        <View className={className}>{children}</View>
      </View>
    </View>
  );
}
