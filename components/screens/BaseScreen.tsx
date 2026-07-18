import React, { ReactNode } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View } from 'react-native';

type BaseScreenProps = {
  children: ReactNode;
  className?: string;
};

export default function BaseScreen({ children, className }: BaseScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-transparent">
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
