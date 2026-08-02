import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import TaskListScreen from '../TaskListScreen';
import { strings } from '@/constants/strings';

const safeAreaMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

const renderScreen = (ui: React.ReactElement) =>
  render(<SafeAreaProvider initialMetrics={safeAreaMetrics}>{ui}</SafeAreaProvider>);

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light' },
}));

const baseProps = {
  greeting: 'Greeting',
  sectionTitle: 'Today',
  sections: [{ title: 'Today', items: [] }],
  ctaLabel: strings.tasks.addCta,
};

const openInput = (api: ReturnType<typeof render>) => {
  fireEvent.press(api.getByText(strings.tasks.addCta));
  return api.getByPlaceholderText(strings.tasks.newTaskPlaceholder);
};

describe('TaskListScreen add-task flow', () => {
  it('shows a commit button that is disabled while the draft is empty', () => {
    const api = renderScreen(<TaskListScreen {...baseProps} onAddTask={jest.fn()} />);
    openInput(api);

    const commit = api.getByLabelText(strings.a11y.commitTask);
    expect(commit).toBeDisabled();
  });

  it('enables the commit button once the draft has text', () => {
    const api = renderScreen(<TaskListScreen {...baseProps} onAddTask={jest.fn()} />);
    const input = openInput(api);

    fireEvent.changeText(input, 'water the plants');

    expect(api.getByLabelText(strings.a11y.commitTask)).toBeEnabled();
  });

  it('commits via the button, clears the draft, and keeps the input open', () => {
    const onAddTask = jest.fn();
    const api = renderScreen(<TaskListScreen {...baseProps} onAddTask={onAddTask} />);
    const input = openInput(api);

    fireEvent.changeText(input, 'water the plants');
    fireEvent.press(api.getByLabelText(strings.a11y.commitTask));

    expect(onAddTask).toHaveBeenCalledWith('water the plants');
    const stillOpen = api.getByPlaceholderText(strings.tasks.newTaskPlaceholder);
    expect(stillOpen.props.value).toBe('');
  });

  // Rapid entry is the commit button's job now. The keyboard's Done key
  // deliberately falls through to the default blur so that "Done" finishes and
  // closes the row — see the blur test below.
  it('keeps the input open for rapid entry when committing with the button', () => {
    const onAddTask = jest.fn();
    const api = renderScreen(<TaskListScreen {...baseProps} onAddTask={onAddTask} />);
    const input = openInput(api);

    fireEvent.changeText(input, 'first');
    fireEvent.press(api.getByLabelText(strings.a11y.commitTask));

    const stillOpen = api.getByPlaceholderText(strings.tasks.newTaskPlaceholder);
    fireEvent.changeText(stillOpen, 'second');
    fireEvent.press(api.getByLabelText(strings.a11y.commitTask));

    expect(onAddTask).toHaveBeenNthCalledWith(1, 'first');
    expect(onAddTask).toHaveBeenNthCalledWith(2, 'second');
  });

  it('closes the input on blur when the draft is empty', () => {
    const api = renderScreen(<TaskListScreen {...baseProps} onAddTask={jest.fn()} />);
    const input = openInput(api);

    fireEvent(input, 'blur');

    expect(api.queryByPlaceholderText(strings.tasks.newTaskPlaceholder)).toBeNull();
  });

  it('saves the draft on blur when it has text (safety net) and closes', () => {
    const onAddTask = jest.fn();
    const api = renderScreen(<TaskListScreen {...baseProps} onAddTask={onAddTask} />);
    const input = openInput(api);

    fireEvent.changeText(input, 'kept thought');
    fireEvent(input, 'blur');

    expect(onAddTask).toHaveBeenCalledWith('kept thought');
    expect(api.queryByPlaceholderText(strings.tasks.newTaskPlaceholder)).toBeNull();
  });

  it('tapping a task label opens an inline editor with the current text', () => {
    const api = renderScreen(
      <TaskListScreen
        {...baseProps}
        sections={[{ title: 'Today', items: [{ label: 'water the plants', checked: false }] }]}
        onEditTask={jest.fn()}
      />
    );

    fireEvent.press(api.getByText('water the plants'));

    expect(api.getByDisplayValue('water the plants')).toBeTruthy();
  });

  it('committing an edit saves the new label and closes the editor', () => {
    const onEditTask = jest.fn();
    const api = renderScreen(
      <TaskListScreen
        {...baseProps}
        sections={[{ title: 'Today', items: [{ label: 'water the plants', checked: false }] }]}
        onEditTask={onEditTask}
      />
    );

    fireEvent.press(api.getByText('water the plants'));
    const editor = api.getByDisplayValue('water the plants');
    fireEvent.changeText(editor, 'water the garden');
    fireEvent.press(api.getByLabelText(strings.a11y.commitEdit));

    expect(onEditTask).toHaveBeenCalledWith(0, 0, 'water the garden');
    expect(api.queryByDisplayValue('water the garden')).toBeNull();
  });

  it('clearing the text and committing cancels the edit instead of saving', () => {
    const onEditTask = jest.fn();
    const api = renderScreen(
      <TaskListScreen
        {...baseProps}
        sections={[{ title: 'Today', items: [{ label: 'water the plants', checked: false }] }]}
        onEditTask={onEditTask}
      />
    );

    fireEvent.press(api.getByText('water the plants'));
    const editor = api.getByDisplayValue('water the plants');
    fireEvent.changeText(editor, '   ');
    fireEvent(editor, 'submitEditing');

    expect(onEditTask).not.toHaveBeenCalled();
    expect(api.getByText('water the plants')).toBeTruthy();
  });

  it('tapping the checkbox toggles the task without opening the editor', () => {
    const onToggleTask = jest.fn();
    const api = renderScreen(
      <TaskListScreen
        {...baseProps}
        sections={[{ title: 'Today', items: [{ label: 'water the plants', checked: false }] }]}
        onToggleTask={onToggleTask}
        onEditTask={jest.fn()}
      />
    );

    fireEvent.press(api.getByRole('checkbox'));

    expect(onToggleTask).toHaveBeenCalledWith(0, 0);
    expect(api.queryByDisplayValue('water the plants')).toBeNull();
  });

  it('gives a light haptic tick when a task is committed', () => {
    const api = renderScreen(<TaskListScreen {...baseProps} onAddTask={jest.fn()} />);
    const input = openInput(api);

    fireEvent.changeText(input, 'water the plants');
    fireEvent.press(api.getByLabelText(strings.a11y.commitTask));

    expect(Haptics.impactAsync).toHaveBeenCalled();
  });
});
