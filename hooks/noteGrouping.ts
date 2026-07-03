import { todayString } from './taskStorage';
import { strings } from '@/constants/strings';
import type { Note } from '@/types/note';

export type NoteDaySection = {
  key: string; // local YYYY-MM-DD
  title: string; // Today / Yesterday / formatted date
  notes: Note[];
};

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function dayTitle(dayKey: string, now: Date): string {
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (dayKey === todayString(now)) {
    return strings.notes.today;
  }
  if (dayKey === todayString(yesterday)) {
    return strings.notes.yesterday;
  }

  const [year, month, day] = dayKey.split('-').map(Number);
  const monthDay = `${MONTHS[month - 1]} ${day}`;
  return year === now.getFullYear() ? monthDay : `${monthDay}, ${year}`;
}

// Derives the Notes screen structure from a flat list: notes fall under the
// local day they were written, newest day (and newest note within a day) first.
export function groupNotes(notes: Note[], now: Date = new Date()): NoteDaySection[] {
  const newestFirst = [...notes].sort((a, b) => b.createdAt - a.createdAt);

  const days: NoteDaySection[] = [];
  for (const note of newestFirst) {
    const key = todayString(new Date(note.createdAt));
    const section = days[days.length - 1];

    if (section && section.key === key) {
      section.notes.push(note);
    } else {
      days.push({ key, title: dayTitle(key, now), notes: [note] });
    }
  }

  return days;
}
