import React from 'react';
import { ReactNode } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View } from 'react-native';

type BaseScreenProps = {
  children: ReactNode;
  className?: string;
};

export default function BaseScreen({ children, className }: BaseScreenProps) {
  return (
    <SafeAreaView className="flex-1 bg-surface-page dark:bg-surface-dark-page">
      <View className={`flex-1 px-5 pb-24 ${className ?? ''}`}>{children}</View>
    </SafeAreaView>
  );
}
