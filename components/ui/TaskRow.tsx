import React, { useRef } from 'react';
import { Feather } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import ReanimatedSwipeable, {
  SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import { RowDeleteAction } from './RowActions';
import { strings } from '@/constants/strings';

type TaskRowProps = {
  label: string;
  time?: string;
  checked?: boolean;
  carriedOver?: boolean;
  onToggle?: () => void;
  onLabelPress?: () => void;
  onDelete?: () => void;
  onTagPress?: () => void;
};

// Row gesture language (app-wide): tap the checkbox to complete, tap the text
// to edit, swipe left to let go.
export default function TaskRow({
  label,
  time,
  checked,
  carriedOver,
  onToggle,
  onLabelPress,
  onDelete,
  onTagPress,
}: TaskRowProps) {
  const swipeRef = useRef<SwipeableMethods>(null);

  const closeThen = (action: () => void) => () => {
    swipeRef.current?.close();
    action();
  };

  const row = (
    <View className="flex-row items-center py-[13px]">
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: Boolean(checked) }}
        accessibilityLabel={label}
        onPress={onToggle}
        hitSlop={10}
        className={`mr-4 h-5 w-5 items-center justify-center rounded-full border ${
          checked
            ? 'bg-primary border-primary'
            : 'border-ink-quaternary dark:border-ink-dark-quaternary'
        }`}
      >
        {checked ? <Feather name="check" size={14} color="#F6F2EC" /> : null}
      </Pressable>
      <Pressable className="flex-1" onPress={onLabelPress}>
        <Text
          className={`text-[21px] leading-7 text-ink-secondary dark:text-ink-dark-secondary ${
            checked ? 'line-through opacity-55' : ''
          }`}
        >
          {label}
        </Text>
      </Pressable>
      {carriedOver ? (
        <Pressable
          onPress={onTagPress}
          hitSlop={8}
          className="ml-3 rounded-full bg-primary/15 px-2.5 py-1"
        >
          <Text className="text-[12px] font-medium text-primary">
            {strings.tasks.carriedOverTag}
          </Text>
        </Pressable>
      ) : null}
      {time ? (
        <Text className="ml-3 text-[17px] text-ink-tertiary dark:text-ink-dark-tertiary">
          {time}
        </Text>
      ) : null}
    </View>
  );

  if (!onDelete) {
    return row;
  }

  return (
    <ReanimatedSwipeable
      ref={swipeRef}
      friction={2}
      overshootFriction={8}
      renderRightActions={() => <RowDeleteAction onDelete={closeThen(onDelete)} />}
    >
      {row}
    </ReanimatedSwipeable>
  );
}
