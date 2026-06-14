import React from 'react';
import { Text, View } from 'react-native';

type HeaderProps = {
  title: string;
  rightHint?: string;
  centered?: boolean;
  inverted?: boolean;
};

export default function Header({
  title,
  rightHint = '..',
  centered = false,
  inverted = false,
}: HeaderProps) {
  const titleClass = inverted
    ? 'text-ink-dark-primary'
    : 'text-ink-primary dark:text-ink-dark-primary';
  const hintClass = inverted
    ? 'text-ink-dark-tertiary'
    : 'text-ink-tertiary dark:text-ink-dark-tertiary';

  return (
    <View
      className={`flex-row items-start pt-4 pb-4 ${
        centered ? 'justify-center' : 'justify-between'
      }`}
    >
      <Text className={`text-[34px] font-serif ${titleClass}`}>{title}</Text>
      {centered ? null : (
        <Text className={`text-2xl tracking-[4px] ${hintClass}`}>{rightHint}</Text>
      )}
    </View>
  );
}
