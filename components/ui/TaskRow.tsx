import React from 'react';
import { Feather } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

type TaskRowProps = {
  label: string;
  time?: string;
  checked?: boolean;
  onPress?: () => void;
};

export default function TaskRow({ label, time, checked, onPress }: TaskRowProps) {
  return (
    <Pressable className="flex-row items-center py-[13px]" onPress={onPress}>
      <View
        className={`mr-4 h-5 w-5 items-center justify-center rounded-full border ${
          checked
            ? 'bg-primary border-primary'
            : 'border-ink-quaternary dark:border-ink-dark-quaternary'
        }`}
      >
        {checked ? <Feather name="check" size={14} color="#F6F2EC" /> : null}
      </View>
      <Text
        className={`flex-1 text-[21px] leading-7 text-ink-secondary dark:text-ink-dark-secondary ${
          checked ? 'line-through opacity-55' : ''
        }`}
      >
        {label}
      </Text>
      {time ? (
        <Text className="ml-3 text-[17px] text-ink-tertiary dark:text-ink-dark-tertiary">
          {time}
        </Text>
      ) : null}
    </Pressable>
  );
}
