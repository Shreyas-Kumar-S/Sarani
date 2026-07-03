import React from 'react';
import NotesScreen from '@/components/screens/NotesScreen';
import { strings } from '@/constants/strings';
import { useNotes } from '@/hooks/NoteStore';

export default function NotesTabScreen() {
  const { notes, addNote, editNote, deleteNote } = useNotes();

  return (
    <NotesScreen
      title={strings.notes.title}
      notes={notes}
      ctaLabel={strings.notes.newNoteCta}
      onAddNote={addNote}
      onEditNote={editNote}
      onDeleteNote={deleteNote}
    />
  );
}
