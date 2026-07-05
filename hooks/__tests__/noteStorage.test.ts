import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadNotes, makeNoteId, saveNotes } from '../noteStorage';
import type { Note } from '@/types/note';

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('noteStorage', () => {
  it('returns null on first run', async () => {
    expect(await loadNotes()).toBeNull();
  });

  it('round-trips notes through storage', async () => {
    const notes: Note[] = [
      { id: 'a', text: 'a quote to remember', createdAt: 1720000000000 },
      { id: 'b', text: 'passing thought', createdAt: 1720000001000 },
    ];

    await saveNotes(notes);

    expect(await loadNotes()).toEqual(notes);
  });

  it('treats corrupted storage as first run instead of crashing', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    await AsyncStorage.setItem('serein.notes.v1', 'not json {');

    expect(await loadNotes()).toBeNull();
    warn.mockRestore();
  });

  it('generates unique ids', () => {
    const ids = new Set(Array.from({ length: 100 }, () => makeNoteId()));

    expect(ids.size).toBe(100);
  });
});
