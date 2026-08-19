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
export async function loadTasks(today: string = todayString()): Promise<PersistedState | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as PersistedState;
    const tasksByTab = { ...EMPTY, ...parsed.tasksByTab };

    // Tasks saved before createdAt existed have none. Backfilling to `today`
    // rather than leaving it undefined means decay (lib/taskDecay.ts) starts
    // counting from this load onward instead of being silently disabled
    // forever for anyone who already had tasks saved — and since the
    // backfilled date is today either way, nothing reads as stale on the
    // very load that adds the field.
    const tabs = Object.keys(tasksByTab) as TabKey[];
    const backfilled = tabs.reduce(
      (acc, tab) => {
        acc[tab] = tasksByTab[tab].map((task) =>
          task.createdAt ? task : { ...task, createdAt: today }
        );
        return acc;
      },
      {} as Record<TabKey, TaskItem[]>
    );

    return {
      tasksByTab: backfilled,
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
