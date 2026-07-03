import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { strings } from '@/constants/strings';

type RowDeleteActionProps = {
  onDelete: () => void;
};

// Destructive action revealed by swiping a row left. Deliberately muted — no
// alarm red; letting go is calm here.
export function RowDeleteAction({ onDelete }: RowDeleteActionProps) {
  return (
    <View className="flex-row items-center justify-end pr-3">
      <Pressable
        accessibilityRole="button"
        onPress={onDelete}
        className="rounded-full bg-[#A96F63]/15 px-4 py-2"
      >
        <Text className="text-[15px] font-medium text-[#A96F63]">{strings.actions.letItGo}</Text>
      </Pressable>
    </View>
  );
}
