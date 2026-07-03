// A small note — no titles, no folders. Day grouping in the UI is derived
// from createdAt.
export type Note = {
  id: string;
  text: string;
  createdAt: number; // epoch ms
};
