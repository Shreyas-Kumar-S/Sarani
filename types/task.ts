export type TaskItem = {
  label: string;
  time?: string;
  checked?: boolean;
};

export type TaskSection = {
  title: string;
  items: TaskItem[];
};
