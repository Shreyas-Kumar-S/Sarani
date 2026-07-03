import React from 'react';
import { Pressable, Text } from 'react-native';

type PrimaryButtonProps = {
  label: string;
  variant?: 'default' | 'notes';
  onPress?: () => void;
};

export default function PrimaryButton({ label, variant = 'default', onPress }: PrimaryButtonProps) {
  const buttonClass =
    variant === 'notes'
      ? 'mt-8 bg-[#94A396]/85 py-4'
      : 'mt-4 bg-surface-inset/80 dark:bg-surface-dark-inset py-4';
  const textClass =
    variant === 'notes'
      ? 'font-serif text-[22px] text-ink-dark-primary'
      : 'text-[18px] text-ink-secondary dark:text-ink-dark-secondary';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => (pressed ? { opacity: 0.8 } : null)}
      className={`items-center justify-center rounded-full ${buttonClass}`}
    >
      <Text className={textClass}>{label}</Text>
    </Pressable>
  );
}
