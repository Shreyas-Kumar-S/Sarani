import React, { ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NoteProvider, useNotes } from '../NoteStore';
import type { Note } from '@/types/note';

const wrapper = ({ children }: { children: ReactNode }) => <NoteProvider>{children}</NoteProvider>;

const seed = (notes: Note[]) => AsyncStorage.setItem('serein.notes.v1', JSON.stringify(notes));

const stored = async (): Promise<Note[]> => {
  const raw = await AsyncStorage.getItem('serein.notes.v1');
  return raw ? JSON.parse(raw) : [];
};

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('NoteStore', () => {
  it('hydrates from stored notes on mount', async () => {
    await seed([{ id: 'a', text: 'stored thought', createdAt: 1 }]);

    const { result } = renderHook(useNotes, { wrapper });

    await waitFor(() => expect(result.current.notes).toHaveLength(1));
    expect(result.current.notes[0].text).toBe('stored thought');
  });

  it('addNote creates a note stamped with now and persists it', async () => {
    const { result } = renderHook(useNotes, { wrapper });
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    const before = Date.now();
    act(() => {
      result.current.addNote('fresh thought');
    });

    expect(result.current.notes).toHaveLength(1);
    const added = result.current.notes[0];
    expect(added.text).toBe('fresh thought');
    expect(added.createdAt).toBeGreaterThanOrEqual(before);
    await waitFor(async () => expect(await stored()).toHaveLength(1));
  });

  it('editNote rewrites text in place without touching createdAt', async () => {
    await seed([{ id: 'a', text: 'old', createdAt: 42 }]);
    const { result } = renderHook(useNotes, { wrapper });
    await waitFor(() => expect(result.current.notes).toHaveLength(1));

    act(() => {
      result.current.editNote('a', 'new');
    });

    expect(result.current.notes[0]).toEqual({ id: 'a', text: 'new', createdAt: 42 });
  });

  it('deleteNote lets a note go', async () => {
    await seed([{ id: 'a', text: 'x', createdAt: 1 }]);
    const { result } = renderHook(useNotes, { wrapper });
    await waitFor(() => expect(result.current.notes).toHaveLength(1));

    act(() => {
      result.current.deleteNote('a');
    });

    expect(result.current.notes).toHaveLength(0);
  });
});
