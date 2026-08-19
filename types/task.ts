export type TaskItem = {
  label: string;
  time?: string;
  checked?: boolean;
  // Local YYYY-MM-DD the task was added — same format as taskStorage's
  // todayString(). Used by lib/taskDecay.ts; not shown anywhere directly.
  createdAt?: string;
  // A Today task that survived a day change → wears the "Undone" tag until the
  // user promotes it to Upcoming. Only ever set on Today tasks.
  carriedOver?: boolean;
};

export type TaskSection = {
  title: string;
  items: TaskItem[];
};
