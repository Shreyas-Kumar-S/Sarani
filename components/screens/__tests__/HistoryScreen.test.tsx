import React from 'react';
import { Pressable, Text } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import HistoryScreen from '../HistoryScreen';
import { strings } from '@/constants/strings';
import type { TaskItem } from '@/types/task';

const safeAreaMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

// Pin "today" so the active month, year and month list are deterministic
// regardless of when the suite runs.
jest.mock('@/hooks/taskStorage', () => ({
  todayString: () => '2026-06-15',
}));

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Controlled history data — each test sets what dates exist and what each holds.
const mockGetDay = jest.fn<TaskItem[], [string]>();
let mockDatesWithHistory: string[] = [];
jest.mock('@/hooks/TaskStore', () => ({
  useHistory: () => ({
    getDay: mockGetDay,
    datesWithHistory: mockDatesWithHistory,
  }),
}));

// Stub the reanimated month scroller with a plain button per month, so tests
// can drive month selection without touching the real scroll/worklet logic.
jest.mock('@/components/ui/HistoryMonthSelector', () => {
  const { Pressable: P, Text: T } = require('react-native');
  return {
    __esModule: true,
    default: ({
      months,
      onSelect,
    }: {
      months: { key: string }[];
      onSelect: (key: string) => void;
    }) => (
      <>
        {months.map((m) => (
          <P key={m.key} accessibilityLabel={`select-${m.key}`} onPress={() => onSelect(m.key)}>
            <T>{m.key}</T>
          </P>
        ))}
      </>
    ),
  };
});

const renderScreen = () =>
  render(
    <SafeAreaProvider initialMetrics={safeAreaMetrics}>
      <HistoryScreen />
    </SafeAreaProvider>
  );

beforeEach(() => {
  mockPush.mockClear();
  mockGetDay.mockReset();
  mockDatesWithHistory = [];
});

describe('HistoryScreen', () => {
  it('titles the screen with the current month and year', () => {
    const { getByText } = renderScreen();
    expect(getByText('June 2026')).toBeTruthy();
  });

  it('shows only the active month’s days and hides other months’ history', () => {
    mockDatesWithHistory = ['2026-06-10', '2026-06-12', '2026-05-20'];
    mockGetDay.mockImplementation((date) => {
      if (date === '2026-06-10') return [{ label: 'june early task', checked: true }];
      if (date === '2026-06-12') return [{ label: 'june later task', checked: false }];
      if (date === '2026-05-20') return [{ label: 'may task', checked: true }];
      return [];
    });

    const { getByText, queryByText } = renderScreen();

    // Both June entries render...
    expect(getByText('june early task')).toBeTruthy();
    expect(getByText('june later task')).toBeTruthy();
    // ...and the May entry is filtered out while June is active.
    expect(queryByText('may task')).toBeNull();
  });

  it('shows the empty state and routes to Today when there is no history this month', () => {
    mockDatesWithHistory = [];

    const { getByText } = renderScreen();

    expect(getByText(strings.history.emptyTitle)).toBeTruthy();
    fireEvent.press(getByText(strings.history.emptyCta));
    expect(mockPush).toHaveBeenCalledWith('/(tabs)/today');
  });

  it('does not show the empty CTA once the active month has entries', () => {
    mockDatesWithHistory = ['2026-06-01'];
    mockGetDay.mockReturnValue([{ label: 'a done thing', checked: true }]);

    const { queryByText, getByText } = renderScreen();

    expect(getByText('a done thing')).toBeTruthy();
    expect(queryByText(strings.history.emptyCta)).toBeNull();
  });

  it('re-filters the day list when a different month is selected', () => {
    mockDatesWithHistory = ['2026-06-10', '2026-05-20'];
    mockGetDay.mockImplementation((date) =>
      date === '2026-06-10'
        ? [{ label: 'june task', checked: false }]
        : [{ label: 'may task', checked: true }]
    );

    const { getByText, getByLabelText, queryByText } = renderScreen();

    // June is active by default.
    expect(getByText('june task')).toBeTruthy();
    expect(queryByText('may task')).toBeNull();

    // Switch to May via the stubbed selector.
    fireEvent.press(getByLabelText('select-MAY-2026'));

    expect(getByText('May 2026')).toBeTruthy();
    expect(getByText('may task')).toBeTruthy();
    expect(queryByText('june task')).toBeNull();
  });
});
