import React from 'react';
import { Text, View } from 'react-native';

type TaskRowProps = {
  label: string;
  time?: string;
  checked?: boolean;
};

export default function TaskRow({ label, time, checked }: TaskRowProps) {
  return (
    <View className="flex-row items-center py-3">
      <View
        className={`h-5 w-5 rounded-full border mr-3 ${
          checked
            ? 'bg-primary border-primary'
            : 'border-ink-quaternary dark:border-ink-dark-quaternary'
        }`}
      />
      <Text className="flex-1 text-[15px] text-ink-primary dark:text-ink-dark-primary">
        {label}
      </Text>
      {time ? (
        <Text className="text-xs text-ink-quaternary dark:text-ink-dark-quaternary">
          {time}
        </Text>
      ) : null}
    </View>
  );
}
