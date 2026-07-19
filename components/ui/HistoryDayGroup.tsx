import React from 'react';
import { Feather } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { HistoryDay } from '@/types/history';

type HistoryDayGroupProps = {
  day: HistoryDay;
  isLast?: boolean;
};

export default function HistoryDayGroup({ day, isLast = false }: HistoryDayGroupProps) {
  return (
    <View
      className={
        isLast
          ? ''
          : 'mb-5 border-b border-ink-quaternary/15 pb-4 dark:border-ink-dark-quaternary/15'
      }
    >
      <Text className="mb-2.5 text-[13px] font-semibold tracking-wide text-ink-tertiary dark:text-ink-dark-tertiary">
        {day.date}
      </Text>
      {day.items.map((item, index) => (
        <View
          key={`${day.date}-${item.label}-${index}`}
          className="flex-row items-center gap-3 py-1.5"
        >
          <View
            className={`h-5 w-5 items-center justify-center rounded-full border ${
              item.checked
                ? 'border-primary bg-primary'
                : 'border-ink-quaternary dark:border-ink-dark-quaternary'
            }`}
          >
            {item.checked ? <Feather name="check" size={12} color="#F6F2EC" /> : null}
          </View>
          <Text
            className={`flex-1 text-[15px] text-ink-secondary dark:text-ink-dark-secondary ${
              item.checked ? 'opacity-55 line-through' : ''
            }`}
          >
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  );
}
