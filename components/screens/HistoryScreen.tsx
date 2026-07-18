import React, { useState } from 'react';
import { ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HistoryDayGroup from '@/components/ui/HistoryDayGroup';
import HistoryMonthSelector from '@/components/ui/HistoryMonthSelector';
import { strings } from '@/constants/strings';
import { defaultHistoryMonthKey, historyByMonth, historyMonths } from '@/data/mock/history';

const SCREEN_PADDING_HORIZONTAL = 22;

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const [activeMonthKey, setActiveMonthKey] = useState(defaultHistoryMonthKey);
  const activeMonth = historyMonths.find((m) => m.key === activeMonthKey) ?? historyMonths[0];
  const days = historyByMonth[activeMonthKey] ?? [];

  return (
    <View className="flex-1 bg-surface-inset dark:bg-surface-dark-inset">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 26,
          paddingBottom: insets.bottom + 96,
          paddingHorizontal: SCREEN_PADDING_HORIZONTAL,
        }}
      >
        <Text className="font-serif text-[32px] text-ink-primary dark:text-ink-dark-primary">
          {activeMonth.fullLabel} {activeMonth.year}
        </Text>

        <HistoryMonthSelector
          months={historyMonths}
          activeMonthKey={activeMonthKey}
          onSelect={setActiveMonthKey}
          containerWidth={screenWidth - SCREEN_PADDING_HORIZONTAL * 2}
        />

        <View className="mt-6">
          <View className="self-start rounded-t-xl bg-primary/85 px-4 py-2 dark:bg-primary-dark">
            <Text className="text-[13px] font-semibold text-white">
              {activeMonth.fullLabel} History
            </Text>
          </View>
          <View className="rounded-b-2xl rounded-tr-2xl bg-primary/85 p-2 shadow-md dark:bg-primary-dark">
            <View className="rounded-b-xl rounded-tr-xl bg-surface-primary px-4 py-5 dark:bg-surface-dark-primary">
              {days.length === 0 ? (
                <Text className="py-6 text-center text-[15px] text-ink-tertiary dark:text-ink-dark-tertiary">
                  {strings.history.empty}
                </Text>
              ) : (
                days.map((day, index) => (
                  <HistoryDayGroup key={day.date} day={day} isLast={index === days.length - 1} />
                ))
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
