export type TaskItem = {
  label: string;
  time?: string;
  checked?: boolean;
  // A Today task that survived a day change → wears the "Undone" tag until the
  // user promotes it to Upcoming. Only ever set on Today tasks.
  carriedOver?: boolean;
};

export type TaskSection = {
  title: string;
  items: TaskItem[];
};
