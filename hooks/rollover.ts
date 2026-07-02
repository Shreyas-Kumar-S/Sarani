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

  const rolledToday = tasksByTab.today
    .filter((task) => !task.checked)
    .map((task) => ({ ...task, carriedOver: true }));

  return {
    tasksByTab: { ...tasksByTab, today: rolledToday },
    changed: true,
  };
}
