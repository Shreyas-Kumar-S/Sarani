import React from 'react';
import NotesScreen from '../../components/screens/NotesScreen';
import { notesBlocks } from '../../data/mock/notes';

export default function ListsScreen() {
  return <NotesScreen title="Notes" blocks={notesBlocks} ctaLabel="+ New note" />;
}
