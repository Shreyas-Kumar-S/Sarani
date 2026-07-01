import React, { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import { TaskItem } from '@/types/task';

export type TabKey = 'today' | 'upcoming' | 'someday';

type TaskStore = {
  tasksByTab: Record<TabKey, TaskItem[]>;
  addTask: (tab: TabKey, label: string) => void;
  toggleTask: (tab: TabKey, itemIndex: number) => void;
  removeTask: (tab: TabKey, itemIndex: number) => void;
};

const TaskContext = createContext<TaskStore | null>(null);

const EMPTY_TASKS: Record<TabKey, TaskItem[]> = {
  today: [],
  upcoming: [],
  someday: [],
};

export function TaskProvider({ children }: { children: ReactNode }) {
  const [tasksByTab, setTasksByTab] = useState<Record<TabKey, TaskItem[]>>(EMPTY_TASKS);

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

  return (
    <TaskContext.Provider value={{ tasksByTab, addTask, toggleTask, removeTask }}>
      {children}
    </TaskContext.Provider>
  );
}

function useTaskStore() {
  const store = useContext(TaskContext);
  if (!store) {
    throw new Error('Task hooks must be used within a <TaskProvider>');
  }
  return store;
}

// Screen-facing hook — mirrors the section/item signature TaskListScreen expects.
export function useTaskList(tab: TabKey) {
  const { tasksByTab, addTask, toggleTask, removeTask } = useTaskStore();
  return {
    tasks: tasksByTab[tab],
    addTask: (label: string) => addTask(tab, label),
    toggleTask: (_sectionIndex: number, itemIndex: number) => toggleTask(tab, itemIndex),
    removeTask: (_sectionIndex: number, itemIndex: number) => removeTask(tab, itemIndex),
  };
}

// True only when a tab has tasks and every one of them is checked off.
export function useTabAllComplete(tab: TabKey) {
  const { tasksByTab } = useTaskStore();
  const items = tasksByTab[tab];
  return items.length > 0 && items.every((task) => task.checked);
}
