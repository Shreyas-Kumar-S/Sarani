import React from 'react';
import { Text, View } from 'react-native';

type HeaderProps = {
  title: string;
  rightHint?: string;
};

export default function Header({ title, rightHint = '•••' }: HeaderProps) {
  return (
    <View className="flex-row items-start justify-between pt-4 pb-4">
      <Text className="text-3xl font-serif text-ink-primary dark:text-ink-dark-primary">
        {title}
      </Text>
      <Text className="text-xl text-ink-quaternary dark:text-ink-dark-quaternary">
        {rightHint}
      </Text>
    </View>
  );
}
