import { BlurView } from 'expo-blur';
import { useColorScheme } from 'nativewind';
import React, { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useBlurTarget } from '@/hooks/BlurTarget';

type GlassCardProps = {
  children: ReactNode;
  className?: string;
};

export default function GlassCard({ children, className = '' }: GlassCardProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const blurTarget = useBlurTarget();

  return (
    <View
      className="rounded-[28px]"
      style={{
        boxShadow: isDark ? '0px 8px 22px rgba(0, 0, 0, 0.7)' : '0px 8px 22px rgba(0,0,0,0.13)',
      }}
    >
      <View className="overflow-hidden rounded-[28px] border border-black/[0.12] dark:border-white/10">
        <BlurView
          blurMethod="dimezisBlurView"
          blurTarget={blurTarget}
          intensity={isDark ? 28 : 55}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
        <View style={StyleSheet.absoluteFill} className={isDark ? 'bg-black/72' : 'bg-white/22'} />
        <View className={className}>{children}</View>
      </View>
    </View>
  );
}
