import React from 'react';
import { Text, TouchableOpacity } from 'react-native';

type PrimaryButtonProps = {
  label: string;
};

export default function PrimaryButton({ label }: PrimaryButtonProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      className="mt-4 items-center justify-center rounded-full bg-surface-secondary dark:bg-surface-dark-secondary py-3"
    >
      <Text className="text-sm text-ink-secondary dark:text-ink-dark-secondary">
        {label}
      </Text>
    </TouchableOpacity>
  );
}
