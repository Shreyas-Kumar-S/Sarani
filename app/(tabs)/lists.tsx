import React from 'react';
import NotesScreen from '@/components/screens/NotesScreen';
import { strings } from '@/constants/strings';
import { notesBlocks } from '@/data/mock/notes';

export default function ListsScreen() {
  return (
    <NotesScreen
      title={strings.notes.title}
      blocks={notesBlocks}
      ctaLabel={strings.notes.newNoteCta}
    />
  );
}
