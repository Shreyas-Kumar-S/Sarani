import AsyncStorage from '@react-native-async-storage/async-storage';
import { todayString } from './taskStorage';

const KEY = 'sarani.dailyFocus.v1';

export type DailyFocusStatus = 'unset' | 'active' | 'completed' | 'deleted';

export type DailyFocus = {
  status: DailyFocusStatus;
  label: string | null;
  date: string;
};

const empty = (status: DailyFocusStatus): DailyFocus => ({
  status,
  label: null,
  date: todayString(),
});

function resolveForToday(stored: DailyFocus | null): DailyFocus {
  if (!stored || stored.date !== todayString()) {
    return empty('unset');
  }
  return stored;
}

export async function loadDailyFocus(): Promise<DailyFocus> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return resolveForToday(raw ? (JSON.parse(raw) as DailyFocus) : null);
  } catch (error) {
    console.warn('[sarani] failed to load daily focus', error);
    return empty('unset');
  }
}

async function persist(next: DailyFocus): Promise<DailyFocus> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  } catch (error) {
    console.warn('[sarani] failed to save daily focus', error);
  }
  return next;
}

export const declareDailyFocus = (label: string) =>
  persist({ status: 'active', label, date: todayString() });

export const completeDailyFocus = () => persist(empty('completed'));

export const deleteDailyFocus = () => persist(empty('deleted'));
