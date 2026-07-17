export type HistoryTaskEntry = {
  label: string;
  checked: boolean;
};

export type HistoryDay = {
  date: string;
  items: HistoryTaskEntry[];
};

// The month scroller shows only `shortLabel` (no year — the year already
// appears once in the screen title) but each key is year-qualified so
// multiple years' Junes, say, don't collide.
export type HistoryMonth = {
  key: string;
  shortLabel: string;
  fullLabel: string;
  year: number;
};
