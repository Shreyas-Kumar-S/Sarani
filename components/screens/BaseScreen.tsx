import React, { ReactNode } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View } from 'react-native';

type BaseScreenProps = {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'notes';
};

export default function BaseScreen({ children, className, variant = 'default' }: BaseScreenProps) {
  const insets = useSafeAreaInsets();

  // Default screens stay transparent so the persistent atmospheric background
  // (rendered once in the tabs layout) shows through and remains continuous
  // across tab switches. The notes variant paints its own opaque surface.
  const backgroundClass = variant === 'notes' ? 'bg-[#303a36] dark:bg-[#303a36]' : 'bg-transparent';

  return (
    <View className={`flex-1 ${backgroundClass}`}>
      <View
        style={{
          flex: 1,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        }}
      >
        <View className={`flex-1 px-5 pb-24 ${className ?? ''}`}>{children}</View>
      </View>
    </View>
  );
}
