import { TaskItem } from '@/types/task';

export const DECAY_THRESHOLD_DAYS = 2;

// Whole calendar days between two local YYYY-MM-DD dates — matches how
// `today` and `createdAt` are both recorded (see taskStorage.ts's
// todayString), so this stays correct without touching real-time Date
// arithmetic on anything but midnight-aligned strings.
export function daysBetween(fromDate: string, toDate: string): number {
  const from = new Date(`${fromDate}T00:00:00`);
  const to = new Date(`${toDate}T00:00:00`);
  return Math.round((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000));
}

// A task decays once it's sat unchecked for more than DECAY_THRESHOLD_DAYS.
// Checked tasks never decay, and a task with no createdAt (shouldn't happen
// past taskStorage's migration, but this stays defensive) is treated as not
// yet decayed rather than crashing on the comparison.
export function isDecayed(
  task: Pick<TaskItem, 'checked' | 'createdAt'>,
  today: string
): boolean {
  if (task.checked || !task.createdAt) {
    return false;
  }
  return daysBetween(task.createdAt, today) > DECAY_THRESHOLD_DAYS;
}
