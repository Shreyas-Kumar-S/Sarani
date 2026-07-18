import AsyncStorage from '@react-native-async-storage/async-storage';
import { TaskItem } from '@/types/task';

// Versioned so a future shape change can migrate rather than silently break.
const STORAGE_KEY = 'serein.history.v1';

export type HistoryByDate = Record<string, TaskItem[]>;

export type PersistedHistory = {
  // A day's Today list, mirrored live as it changes — the entry for a past
  // date is naturally frozen once the day advances, since the mirror moves
  // on to writing the new date's key.
  todaySnapshots: HistoryByDate;
  // Completions logged from Upcoming/Someday (which have no day of their
  // own), keyed by the date they were checked off on.
  otherCompletions: HistoryByDate;
};

const EMPTY: PersistedHistory = { todaySnapshots: {}, otherCompletions: {} };

// Reads persisted history. Any read/parse failure is logged quietly and
// treated as first run (null), same convention as taskStorage.
export async function loadHistory(): Promise<PersistedHistory | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<PersistedHistory>;
    return {
      todaySnapshots: { ...EMPTY.todaySnapshots, ...parsed.todaySnapshots },
      otherCompletions: { ...EMPTY.otherCompletions, ...parsed.otherCompletions },
    };
  } catch (error) {
    console.warn('[serein] failed to load history', error);
    return null;
  }
}

export async function saveHistory(state: PersistedHistory): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('[serein] failed to save history', error);
  }
}
