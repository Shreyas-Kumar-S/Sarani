import React, {
  createContext,
  ReactNode,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { loadNotes, makeNoteId, saveNotes } from './noteStorage';
import type { Note } from '@/types/note';

type NoteStore = {
  notes: Note[];
  hydrated: boolean;
  addNote: (text: string) => void;
  editNote: (id: string, text: string) => void;
  deleteNote: (id: string) => void;
};

const NoteContext = createContext<NoteStore | null>(null);

// Mounted alongside TaskProvider in the tabs layout. Provider-level (not
// screen-local) because the evening wind-down ritual will later write into
// today's notes from outside the Notes tab.
export function NoteProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);
  // Same hydration gate as TaskStore: never persist the empty starting state
  // over saved data before the initial load completes.
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const loaded = await loadNotes();
      if (cancelled) {
        return;
      }

      if (loaded) {
        setNotes(loaded);
      }
      setHydrated(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    saveNotes(notes);
  }, [notes, hydrated]);

  const addNote = useCallback((text: string) => {
    setNotes((prev) => [...prev, { id: makeNoteId(), text, createdAt: Date.now() }]);
  }, []);

  const editNote = useCallback((id: string, text: string) => {
    setNotes((prev) => prev.map((note) => (note.id === id ? { ...note, text } : note)));
  }, []);

  const deleteNote = useCallback((id: string) => {
    setNotes((prev) => prev.filter((note) => note.id !== id));
  }, []);

  const value = useMemo(
    () => ({ notes, hydrated, addNote, editNote, deleteNote }),
    [notes, hydrated, addNote, editNote, deleteNote]
  );

  return <NoteContext.Provider value={value}>{children}</NoteContext.Provider>;
}

export function useNotes() {
  const store = use(NoteContext);
  if (!store) {
    throw new Error('Note hooks must be used within a <NoteProvider>');
  }
  return store;
}
