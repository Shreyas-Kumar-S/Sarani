import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import NotesScreen from '../NotesScreen';
import { strings } from '@/constants/strings';
import type { Note } from '@/types/note';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light' },
}));

const safeAreaMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

const renderScreen = (ui: React.ReactElement) =>
  render(<SafeAreaProvider initialMetrics={safeAreaMetrics}>{ui}</SafeAreaProvider>);

const baseProps = {
  title: strings.notes.title,
  ctaLabel: strings.notes.newNoteCta,
};

describe('NotesScreen', () => {
  it('shows the gentle empty state when there are no notes', () => {
    const api = renderScreen(<NotesScreen {...baseProps} notes={[]} />);

    expect(api.getByText(strings.notes.empty)).toBeTruthy();
  });

  it('opens a composer from the CTA and commits a new note', () => {
    const onAddNote = jest.fn();
    const api = renderScreen(<NotesScreen {...baseProps} notes={[]} onAddNote={onAddNote} />);

    fireEvent.press(api.getByText(strings.notes.newNoteCta));
    const input = api.getByPlaceholderText(strings.notes.newNotePlaceholder);
    fireEvent.changeText(input, 'a passing thought');
    fireEvent.press(api.getByLabelText(strings.a11y.commitNote));

    expect(onAddNote).toHaveBeenCalledWith('a passing thought');
  });

  it('groups notes under their day heading', () => {
    const notes: Note[] = [{ id: 'now', text: 'something from today', createdAt: Date.now() }];
    const api = renderScreen(<NotesScreen {...baseProps} notes={notes} />);

    expect(api.getByText(strings.notes.today)).toBeTruthy();
    expect(api.getByText('something from today')).toBeTruthy();
  });

  it('tapping a note opens an inline editor and commits the change', () => {
    const onEditNote = jest.fn();
    const notes: Note[] = [{ id: 'n1', text: 'first draft', createdAt: Date.now() }];
    const api = renderScreen(<NotesScreen {...baseProps} notes={notes} onEditNote={onEditNote} />);

    fireEvent.press(api.getByText('first draft'));
    const editor = api.getByDisplayValue('first draft');
    fireEvent.changeText(editor, 'second draft');
    fireEvent(editor, 'submitEditing');

    expect(onEditNote).toHaveBeenCalledWith('n1', 'second draft');
  });
});
