import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HistoryDayGroup from '@/components/ui/HistoryDayGroup';
import HistoryMonthSelector from '@/components/ui/HistoryMonthSelector';
import PrimaryButton from '@/components/ui/PrimaryButton';
import { strings } from '@/constants/strings';
import { useHistory } from '@/hooks/TaskStore';
import { todayString } from '@/hooks/taskStorage';
import { formatHistoryDayLabel, generateMonthsForYear, monthKeyForDate } from '@/lib/historyDates';
import { HistoryDay } from '@/types/history';

const SCREEN_PADDING_HORIZONTAL = 22;

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const { getDay, datesWithHistory } = useHistory();

  // The year the month scroller covers and which month starts active — both
  // derived from the real current date, not a fixture.
  const currentYear = useMemo(() => Number(todayString().slice(0, 4)), []);
  const months = useMemo(() => generateMonthsForYear(currentYear), [currentYear]);
  const defaultMonthKey = useMemo(() => monthKeyForDate(todayString()), []);
  const [activeMonthKey, setActiveMonthKey] = useState(defaultMonthKey);
  const activeMonth = months.find((m) => m.key === activeMonthKey) ?? months[0];

  const days: HistoryDay[] = useMemo(
    () =>
      datesWithHistory.reduce<HistoryDay[]>((acc, date) => {
        if (monthKeyForDate(date) === activeMonthKey) {
          acc.push({
            date: formatHistoryDayLabel(date),
            items: getDay(date).map((item) => ({
              label: item.label,
              checked: Boolean(item.checked),
            })),
          });
        }
        return acc;
      }, []),
    [datesWithHistory, activeMonthKey, getDay]
  );

  return (
    <View className="flex-1 bg-surface-inset dark:bg-surface-dark-inset">
      <View
        style={{
          paddingTop: insets.top + 26,
          paddingHorizontal: SCREEN_PADDING_HORIZONTAL,
        }}
      >
        <Text className="font-serif text-[32px] text-ink-primary dark:text-ink-dark-primary">
          {activeMonth.fullLabel} {activeMonth.year}
        </Text>

        <HistoryMonthSelector
          months={months}
          activeMonthKey={activeMonthKey}
          onSelect={setActiveMonthKey}
          containerWidth={screenWidth - SCREEN_PADDING_HORIZONTAL * 2}
        />
      </View>

      <ScrollView
        testID="history-day-scroll"
        showsVerticalScrollIndicator={false}
        // 24px replaces the header's old `mt-6` gap above the day-history
        // card, now that the card is this ScrollView's first child instead
        // of a sibling further down the same scroll region.
        contentContainerStyle={{
          paddingTop: 24,
          paddingBottom: insets.bottom + 96,
          paddingHorizontal: SCREEN_PADDING_HORIZONTAL,
        }}
      >
        <View className="self-start rounded-t-xl bg-primary/85 px-4 py-2 dark:bg-primary-dark">
          <Text className="text-[13px] font-semibold text-white">
            {activeMonth.fullLabel} History
          </Text>
        </View>
        <View className="rounded-b-2xl rounded-tr-2xl bg-primary/85 p-2 shadow-md dark:bg-primary-dark">
          <View className="rounded-b-xl rounded-tr-xl bg-surface-primary px-4 py-5 dark:bg-surface-dark-primary">
            {days.length === 0 ? (
              <View className="items-center py-6">
                <Text className="mb-1 text-center text-[15px] text-ink-tertiary dark:text-ink-dark-tertiary">
                  {strings.history.emptyTitle}
                </Text>
                <PrimaryButton
                  label={strings.history.emptyCta}
                  onPress={() => router.push('/(tabs)/today')}
                />
              </View>
            ) : (
              days.map((day, index) => (
                <HistoryDayGroup key={day.date} day={day} isLast={index === days.length - 1} />
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
