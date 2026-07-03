import React, {
  createContext,
  ReactNode,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { TaskItem } from '@/types/task';
import { applyDailyRollover } from './rollover';
import { loadTasks, saveTasks, todayString } from './taskStorage';

export type TabKey = 'today' | 'upcoming' | 'someday';

type TaskStore = {
  tasksByTab: Record<TabKey, TaskItem[]>;
  addTask: (tab: TabKey, label: string) => void;
  toggleTask: (tab: TabKey, itemIndex: number) => void;
  removeTask: (tab: TabKey, itemIndex: number) => void;
  editTask: (tab: TabKey, itemIndex: number, label: string) => void;
  promoteToUpcoming: (itemIndex: number) => void;
};

const TaskContext = createContext<TaskStore | null>(null);

const EMPTY_TASKS: Record<TabKey, TaskItem[]> = {
  today: [],
  upcoming: [],
  someday: [],
};

export function TaskProvider({ children }: { children: ReactNode }) {
  const [tasksByTab, setTasksByTab] = useState<Record<TabKey, TaskItem[]>>(EMPTY_TASKS);
  // AsyncStorage is async, so state starts empty and fills in after load. We
  // must not persist the empty starting state over saved data before that load
  // completes — `hydrated` gates the persist effect until it does.
  const [hydrated, setHydrated] = useState(false);
  // One local date for the whole session — drives the rollover comparison.
  // Lazy state initializer so todayString() runs once, not on every render.
  const [today] = useState(todayString);

  // Load once on mount: read saved state, apply the daily rollover, adopt it,
  // then record the rolled result + today's date so the rollover isn't redone
  // even if the user makes no edits this session.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const loaded = await loadTasks();
      const { tasksByTab: rolled } = applyDailyRollover(
        loaded?.tasksByTab ?? EMPTY_TASKS,
        loaded?.lastOpenedDate,
        today
      );

      if (cancelled) {
        return;
      }

      setTasksByTab(rolled);
      setHydrated(true);
      saveTasks({ tasksByTab: rolled, lastOpenedDate: today });
    })();

    return () => {
      cancelled = true;
    };
  }, [today]);

  // Persist on every change once hydrated. Safe because state already reflects
  // saved data by this point, so there is no empty-state clobber risk.
  useEffect(() => {
    if (!hydrated) {
      return;
    }
    saveTasks({ tasksByTab, lastOpenedDate: today });
  }, [tasksByTab, hydrated, today]);

  const addTask = useCallback((tab: TabKey, label: string) => {
    setTasksByTab((prev) => ({ ...prev, [tab]: [...prev[tab], { label, checked: false }] }));
  }, []);

  const toggleTask = useCallback((tab: TabKey, itemIndex: number) => {
    setTasksByTab((prev) => ({
      ...prev,
      [tab]: prev[tab].map((task, i) =>
        i === itemIndex ? { ...task, checked: !task.checked } : task
      ),
    }));
  }, []);

  const removeTask = useCallback((tab: TabKey, itemIndex: number) => {
    setTasksByTab((prev) => ({ ...prev, [tab]: prev[tab].filter((_, i) => i !== itemIndex) }));
  }, []);

  const editTask = useCallback((tab: TabKey, itemIndex: number, label: string) => {
    setTasksByTab((prev) => ({
      ...prev,
      [tab]: prev[tab].map((task, i) => (i === itemIndex ? { ...task, label } : task)),
    }));
  }, []);

  // Move a carried-over Today task into Upcoming, shedding the carriedOver flag.
  const promoteToUpcoming = useCallback((itemIndex: number) => {
    setTasksByTab((prev) => {
      const task = prev.today[itemIndex];
      if (!task) {
        return prev;
      }

      const { carriedOver: _carriedOver, ...promoted } = task;
      return {
        ...prev,
        today: prev.today.filter((_, i) => i !== itemIndex),
        upcoming: [...prev.upcoming, promoted],
      };
    });
  }, []);

  const value = useMemo(
    () => ({ tasksByTab, addTask, toggleTask, removeTask, editTask, promoteToUpcoming }),
    [tasksByTab, addTask, toggleTask, removeTask, editTask, promoteToUpcoming]
  );

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
}

function useTaskStore() {
  const store = use(TaskContext);
  if (!store) {
    throw new Error('Task hooks must be used within a <TaskProvider>');
  }
  return store;
}

// Screen-facing hook — mirrors the section/item signature TaskListScreen expects.
export function useTaskList(tab: TabKey) {
  const { tasksByTab, addTask, toggleTask, removeTask, editTask, promoteToUpcoming } =
    useTaskStore();
  return {
    tasks: tasksByTab[tab],
    addTask: (label: string) => addTask(tab, label),
    toggleTask: (_sectionIndex: number, itemIndex: number) => toggleTask(tab, itemIndex),
    removeTask: (_sectionIndex: number, itemIndex: number) => removeTask(tab, itemIndex),
    editTask: (_sectionIndex: number, itemIndex: number, label: string) =>
      editTask(tab, itemIndex, label),
    // Only meaningful on the Today tab; other tabs simply never wire it.
    promoteTask: (itemIndex: number) => promoteToUpcoming(itemIndex),
  };
}

// True only when a tab has tasks and every one of them is checked off.
export function useTabAllComplete(tab: TabKey) {
  const { tasksByTab } = useTaskStore();
  const items = tasksByTab[tab];
  return items.length > 0 && items.every((task) => task.checked);
}
