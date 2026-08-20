import React, {
  createContext,
  ReactNode,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { isDecayed } from '@/lib/taskDecay';
import { TaskItem } from '@/types/task';
import { HistoryByDate, loadHistory, saveHistory } from './historyStorage';
import { applyDailyRollover, sweepCompletedFromOtherTabs } from './rollover';
import { loadTasks, saveTasks, todayString } from './taskStorage';

export type TabKey = 'today' | 'upcoming' | 'someday';

type TaskStore = {
  tasksByTab: Record<TabKey, TaskItem[]>;
  today: string;
  todaySnapshots: HistoryByDate;
  otherCompletions: HistoryByDate;
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
  // A day's Today list, mirrored live below as it changes. Past dates freeze
  // naturally once the day advances, since the mirror moves on to writing
  // the new date's key — no separate "commit at rollover" step needed.
  const [todaySnapshots, setTodaySnapshots] = useState<HistoryByDate>({});
  // Completions logged from Upcoming/Someday, which have no day of their own
  // the way Today does — keyed by the date they were checked off on.
  const [otherCompletions, setOtherCompletions] = useState<HistoryByDate>({});
  // AsyncStorage is async, so state starts empty and fills in after load. We
  // must not persist the empty starting state over saved data before that load
  // completes — `hydrated` gates the persist effect until it does.
  const [hydrated, setHydrated] = useState(false);
  // One local date for the whole session — drives the rollover comparison
  // and which date new history entries are recorded under.
  // Lazy state initializer so todayString() runs once, not on every render.
  const [today] = useState(todayString);

  // Delay before a just-completed Upcoming/Someday task disappears from the
  // live tab into History — long enough that the checkmark itself is seen
  // before the row goes away, short enough that it still reads as one
  // motion ("this moved to History") rather than two.
  const COMPLETED_REMOVAL_DELAY_MS = 700;
  // Pending removal timers, tracked so a still-mounted TaskProvider never
  // calls setState after it's gone (test cleanup unmounts synchronously;
  // this timer doesn't). Cleared on unmount below.
  const pendingRemovals = useRef(new Set<ReturnType<typeof setTimeout>>());
  useEffect(() => {
    return () => {
      pendingRemovals.current.forEach(clearTimeout);
      pendingRemovals.current.clear();
    };
  }, []);

  // Removes `completedTask` from `tab` by object identity, not index — an
  // index captured now could point at a different task by the time this
  // fires, if anything else in the tab changes during the delay. Toggling
  // the task back to unchecked before the timer fires is naturally a no-op:
  // un-checking creates a new object (a fresh `{...t, checked: false}`), so
  // the originally-captured checked reference simply no longer matches
  // anything in the array by the time this runs.
  const scheduleCompletedRemoval = useCallback((tab: TabKey, completedTask: TaskItem) => {
    const timer = setTimeout(() => {
      pendingRemovals.current.delete(timer);
      setTasksByTab((prev) => ({
        ...prev,
        [tab]: prev[tab].filter((t) => t !== completedTask),
      }));
    }, COMPLETED_REMOVAL_DELAY_MS);
    pendingRemovals.current.add(timer);
  }, []);

  // Load once on mount: read saved state, apply the daily rollover, adopt it,
  // then record the rolled result + today's date so the rollover isn't redone
  // even if the user makes no edits this session. History loads alongside it.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [loadedTasks, loadedHistory] = await Promise.all([loadTasks(today), loadHistory()]);
      const { tasksByTab: rolled } = applyDailyRollover(
        loadedTasks?.tasksByTab ?? EMPTY_TASKS,
        loadedTasks?.lastOpenedDate,
        today
      );
      // Drops any Upcoming/Someday task left checked from before this
      // feature shipped (or from a session killed mid-delay) — see
      // sweepCompletedFromOtherTabs' comment in ./rollover for why this
      // can't just be handled by the in-session removal timer alone.
      const swept = sweepCompletedFromOtherTabs(rolled);

      if (cancelled) {
        return;
      }

      setTasksByTab(swept);
      setTodaySnapshots(loadedHistory?.todaySnapshots ?? {});
      setOtherCompletions(loadedHistory?.otherCompletions ?? {});
      setHydrated(true);
      saveTasks({ tasksByTab: swept, lastOpenedDate: today });
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

  // Keeps today's history entry in lockstep with the live Today list —
  // whatever Today looks like right now is exactly what "today" should show
  // in History, checked or not — then persists in the same pass. Combined
  // with the persist step (rather than a separate effect reacting to
  // todaySnapshots) so one change causes one render, not a mirror-effect
  // triggering a second persist-effect.
  useEffect(() => {
    if (!hydrated) {
      return;
    }
    const nextTodaySnapshots = { ...todaySnapshots, [today]: tasksByTab.today };
    setTodaySnapshots(nextTodaySnapshots);
    saveHistory({ todaySnapshots: nextTodaySnapshots, otherCompletions });
    // todaySnapshots is read here to merge into, not to react to — it only
    // ever changes as a result of this same effect, so depending on it would
    // just make the effect re-trigger itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasksByTab.today, otherCompletions, today, hydrated]);

  const addTask = useCallback(
    (tab: TabKey, label: string) => {
      setTasksByTab((prev) => ({
        ...prev,
        [tab]: [...prev[tab], { label, checked: false, createdAt: today }],
      }));
    },
    [today]
  );

  // Upcoming/Someday tasks aren't tied to a day the way Today is, so a
  // completion there is logged into today's history entry directly —
  // un-completing removes it again. The task/nextChecked values are read
  // from the current tasksByTab up front so each state updater below stays
  // pure (no nested setState calls, which React may invoke more than once).
  const toggleTask = useCallback(
    (tab: TabKey, itemIndex: number) => {
      const task = tasksByTab[tab][itemIndex];
      if (!task) {
        return;
      }

      const nextChecked = !task.checked;
      const nextTask = { ...task, checked: nextChecked };

      setTasksByTab((prev) => ({
        ...prev,
        [tab]: prev[tab].map((t, i) => (i === itemIndex ? nextTask : t)),
      }));

      if (tab !== 'today') {
        setOtherCompletions((prevOther) => {
          const dayEntries = prevOther[today] ?? [];
          const withoutExisting = dayEntries.filter((entry) => entry.label !== task.label);

          if (nextChecked) {
            return {
              ...prevOther,
              [today]: [...withoutExisting, { label: task.label, checked: true }],
            };
          }

          return withoutExisting.length === dayEntries.length
            ? prevOther
            : { ...prevOther, [today]: withoutExisting };
        });

        if (nextChecked) {
          scheduleCompletedRemoval(tab, nextTask);
        }
      }
    },
    [tasksByTab, today, scheduleCompletedRemoval]
  );

  const removeTask = useCallback((tab: TabKey, itemIndex: number) => {
    setTasksByTab((prev) => ({ ...prev, [tab]: prev[tab].filter((_, i) => i !== itemIndex) }));
  }, []);

  const editTask = useCallback((tab: TabKey, itemIndex: number, label: string) => {
    setTasksByTab((prev) => ({
      ...prev,
      [tab]: prev[tab].map((task, i) => (i === itemIndex ? { ...task, label } : task)),
    }));
  }, []);

  // Move a carried-over Today task into Upcoming, shedding the carriedOver
  // flag. If it was already checked off, that completion is logged into
  // today's history the same way toggleTask logs an Upcoming/Someday
  // completion — otherwise the move would silently erase today's record of
  // having finished it (it's about to disappear from the live Today mirror).
  const promoteToUpcoming = useCallback(
    (itemIndex: number) => {
      const task = tasksByTab.today[itemIndex];
      if (!task) {
        return;
      }

      const { carriedOver: _carriedOver, ...promoted } = task;

      setTasksByTab((prev) => ({
        ...prev,
        today: prev.today.filter((_, i) => i !== itemIndex),
        upcoming: [...prev.upcoming, promoted],
      }));

      if (task.checked) {
        setOtherCompletions((prevOther) => {
          const dayEntries = prevOther[today] ?? [];
          const withoutExisting = dayEntries.filter((entry) => entry.label !== task.label);
          return {
            ...prevOther,
            [today]: [...withoutExisting, { label: task.label, checked: true }],
          };
        });
        scheduleCompletedRemoval('upcoming', promoted);
      }
    },
    [tasksByTab, today, scheduleCompletedRemoval]
  );

  const value = useMemo(
    () => ({
      tasksByTab,
      today,
      todaySnapshots,
      otherCompletions,
      addTask,
      toggleTask,
      removeTask,
      editTask,
      promoteToUpcoming,
    }),
    [
      tasksByTab,
      today,
      todaySnapshots,
      otherCompletions,
      addTask,
      toggleTask,
      removeTask,
      editTask,
      promoteToUpcoming,
    ]
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
//
// Completed tasks sink to the bottom so the next actionable item stays in view
// instead of being pushed below a wall of finished ones. This is *display*
// order only: the stored array keeps insertion order, so un-checking a task
// returns it to where it was, and History (which mirrors tasksByTab.today
// verbatim) is unaffected.
//
// Every mutation in the store is keyed on the task's index in that stored
// array, so reordering for display without translating indices would send a
// toggle to whichever task happened to land in that slot. `order` maps a
// displayed position back to its stored one, and every callback below goes
// through it.
export function useTaskList(tab: TabKey) {
  const { tasksByTab, today, addTask, toggleTask, removeTask, editTask, promoteToUpcoming } =
    useTaskStore();
  const stored = tasksByTab[tab];

  const { tasks, order } = useMemo(() => {
    // Array.prototype.sort is stable, so each group keeps its insertion order.
    const indices = stored.map((_, index) => index);
    indices.sort((a, b) => Number(stored[a].checked) - Number(stored[b].checked));
    const ordered = indices.map((index) => stored[index]);

    // Decay is a Tomorrow-only concept — see the comment on TaskItem.decayed.
    const displayed =
      tab === 'upcoming'
        ? ordered.map((task) => ({ ...task, decayed: isDecayed(task, today) }))
        : ordered;

    return { tasks: displayed, order: indices };
  }, [stored, tab, today]);

  const storedIndex = (displayIndex: number) => order[displayIndex] ?? displayIndex;

  return {
    tasks,
    addTask: (label: string) => addTask(tab, label),
    toggleTask: (_sectionIndex: number, itemIndex: number) =>
      toggleTask(tab, storedIndex(itemIndex)),
    removeTask: (_sectionIndex: number, itemIndex: number) =>
      removeTask(tab, storedIndex(itemIndex)),
    editTask: (_sectionIndex: number, itemIndex: number, label: string) =>
      editTask(tab, storedIndex(itemIndex), label),
    // Only meaningful on the Today tab; other tabs simply never wire it.
    promoteTask: (itemIndex: number) => promoteToUpcoming(storedIndex(itemIndex)),
  };
}

// True only when a tab has tasks and every one of them is checked off.
export function useTabAllComplete(tab: TabKey) {
  const { tasksByTab } = useTaskStore();
  const items = tasksByTab[tab];
  return items.length > 0 && items.every((task) => task.checked);
}

// Screen-facing hook for the History tab — a date's entry is Today's list on
// that date plus any Upcoming/Someday items completed that same day.
export function useHistory() {
  const { todaySnapshots, otherCompletions } = useTaskStore();

  const getDay = useCallback(
    (date: string): TaskItem[] => [
      ...(todaySnapshots[date] ?? []),
      ...(otherCompletions[date] ?? []),
    ],
    [todaySnapshots, otherCompletions]
  );

  const datesWithHistory = useMemo(() => {
    const dates = new Set([...Object.keys(todaySnapshots), ...Object.keys(otherCompletions)]);
    return Array.from(dates)
      .filter((date) => getDay(date).length > 0)
      .sort();
  }, [todaySnapshots, otherCompletions, getDay]);

  return { getDay, datesWithHistory };
}
