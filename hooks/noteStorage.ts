import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Note } from '@/types/note';

// Versioned so a future shape change can migrate rather than silently break.
const STORAGE_KEY = 'serein.notes.v1';

// Collision-safe enough for a single local device: time component plus a
// random suffix.
export function makeNoteId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

// Any read/parse failure is logged quietly and treated as first run (null),
// matching taskStorage's behavior.
export async function loadNotes(): Promise<Note[] | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as Note[];
  } catch (error) {
    console.warn('[serein] failed to load notes', error);
    return null;
  }
}

export async function saveNotes(notes: Note[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch (error) {
    console.warn('[serein] failed to save notes', error);
  }
}
