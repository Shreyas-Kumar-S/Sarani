import React from 'react';
import { Text, View } from 'react-native';

type SectionTitleProps = {
  title: string;
};

export default function SectionTitle({ title }: SectionTitleProps) {
  return (
    <View className="mb-3">
      <Text className="font-serif text-[25px] text-ink-secondary dark:text-ink-dark-secondary">
        {title}
      </Text>
    </View>
  );
}
