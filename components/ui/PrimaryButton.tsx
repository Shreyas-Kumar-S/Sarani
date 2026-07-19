import React from 'react';
import { Pressable, Text } from 'react-native';

type PrimaryButtonProps = {
  label: string;
  onPress?: () => void;
  accessibilityLabel?: string;
};

export default function PrimaryButton({ label, onPress, accessibilityLabel }: PrimaryButtonProps) {
  const buttonClass =
    'mt-4 bg-black/[0.08] dark:bg-surface-dark-inset px-8 py-4 border border-black/[0.12] dark:border-transparent';
  const textClass = 'text-[18px] text-ink-secondary dark:text-ink-dark-secondary';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      style={({ pressed }) => (pressed ? { opacity: 0.8 } : null)}
      className={`items-center justify-center rounded-full ${buttonClass}`}
    >
      <Text className={textClass}>{label}</Text>
    </Pressable>
  );
}
