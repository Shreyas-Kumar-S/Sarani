import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TabKey } from './TaskStore';
import { TaskItem } from '@/types/task';

// Versioned so a future shape change can migrate rather than silently break.
const STORAGE_KEY = 'sarani.tasks.v1';

const EMPTY: Record<TabKey, TaskItem[]> = {
  today: [],
  upcoming: [],
  someday: [],
};

export type PersistedState = {
  tasksByTab: Record<TabKey, TaskItem[]>;
  lastOpenedDate: string; // local YYYY-MM-DD
};

// Local calendar date (not UTC) — the rollover rule is about the user's day.
export function todayString(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Reads persisted state. Missing tab keys are merged over the empty defaults so
// a partial/legacy blob never crashes a consumer. Any read/parse failure is
// logged quietly and treated as first run (null).
export async function loadTasks(): Promise<PersistedState | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as PersistedState;
    return {
      tasksByTab: { ...EMPTY, ...parsed.tasksByTab },
      lastOpenedDate: parsed.lastOpenedDate,
    };
  } catch (error) {
    console.warn('[sarani] failed to load tasks', error);
    return null;
  }
}

export async function saveTasks(state: PersistedState): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('[sarani] failed to save tasks', error);
  }
}
