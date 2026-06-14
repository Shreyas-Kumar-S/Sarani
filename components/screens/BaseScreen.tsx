import React, { ReactNode } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View } from 'react-native';

type BaseScreenProps = {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'notes';
};

export default function BaseScreen({ children, className, variant = 'default' }: BaseScreenProps) {
  const backgroundClass =
    variant === 'notes'
      ? 'bg-[#303a36] dark:bg-[#303a36]'
      : 'bg-surface-page dark:bg-surface-dark-page';

  return (
    <SafeAreaView className={`flex-1 ${backgroundClass}`}>
      <View className={`flex-1 px-5 pb-24 ${className ?? ''}`}>{children}</View>
    </SafeAreaView>
  );
}
