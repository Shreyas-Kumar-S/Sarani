import type { TabKey } from './TaskStore';
import { TaskItem } from '@/types/task';

export type RolloverResult = {
  tasksByTab: Record<TabKey, TaskItem[]>;
  changed: boolean;
};

// Pure daily rollover. The caller passes `today` (no clock read here) so this
// stays trivially testable. Only the Today bucket is transformed: completed
// tasks are dropped, and every remaining task is flagged `carriedOver` so the
// UI can offer to move it to Upcoming. Upcoming/Someday are never touched.
export function applyDailyRollover(
  tasksByTab: Record<TabKey, TaskItem[]>,
  lastOpenedDate: string | undefined,
  today: string
): RolloverResult {
  if (lastOpenedDate === today) {
    return { tasksByTab, changed: false };
  }

  // Single pass: drop completed tasks and flag the survivors as carried over.
  const rolledToday = tasksByTab.today.reduce<TaskItem[]>((survivors, task) => {
    if (!task.checked) {
      survivors.push({ ...task, carriedOver: true });
    }
    return survivors;
  }, []);

  return {
    tasksByTab: { ...tasksByTab, today: rolledToday },
    changed: true,
  };
}
