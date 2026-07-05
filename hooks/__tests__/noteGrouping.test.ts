import { groupNotes } from '../noteGrouping';
import type { Note } from '@/types/note';

// All dates built via the local-time Date constructor so tests are
// timezone-independent.
const now = new Date(2026, 6, 3, 15, 0); // July 3, 2026, 3pm

const note = (id: string, when: Date): Note => ({
  id,
  text: `note ${id}`,
  createdAt: when.getTime(),
});

describe('groupNotes', () => {
  it('returns no sections for no notes', () => {
    expect(groupNotes([], now)).toEqual([]);
  });

  it('labels today and yesterday, then dates, newest day first', () => {
    const today = note('a', new Date(2026, 6, 3, 9));
    const yesterday = note('b', new Date(2026, 6, 2, 22));
    const older = note('c', new Date(2026, 6, 1, 8));

    const grouped = groupNotes([older, today, yesterday], now);

    expect(grouped.map((d) => d.title)).toEqual(['Today', 'Yesterday', 'July 1']);
  });

  it('includes the year for days from a previous year', () => {
    const grouped = groupNotes([note('old', new Date(2025, 11, 30, 10))], now);

    expect(grouped[0].title).toBe('December 30, 2025');
  });

  it('orders notes within a day newest first', () => {
    const morning = note('morning', new Date(2026, 6, 3, 8));
    const evening = note('evening', new Date(2026, 6, 3, 14));

    const grouped = groupNotes([morning, evening], now);

    expect(grouped[0].notes.map((n) => n.id)).toEqual(['evening', 'morning']);
  });
});
