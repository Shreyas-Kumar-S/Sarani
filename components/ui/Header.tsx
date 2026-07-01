import React from 'react';
import { Text, View } from 'react-native';

type HeaderProps = {
  title: string;
  centered?: boolean;
  inverted?: boolean;
};

export default function Header({ title, centered = false, inverted = false }: HeaderProps) {
  const titleClass = inverted
    ? 'text-ink-dark-primary'
    : 'text-ink-primary dark:text-ink-dark-primary';

  return (
    <View
      className={`flex-row items-start pt-4 pb-4 ${centered ? 'justify-center' : 'justify-start'}`}
    >
      <Text className={`text-[34px] font-serif ${titleClass}`}>{title}</Text>
    </View>
  );
}
