import React, { ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TaskProvider, useTaskList } from '../TaskStore';
import { todayString } from '../taskStorage';

const wrapper = ({ children }: { children: ReactNode }) => <TaskProvider>{children}</TaskProvider>;

// Render both buckets we care about from a single hook.
const useBoth = () => ({
  today: useTaskList('today'),
  upcoming: useTaskList('upcoming'),
});

const seed = (state: unknown) =>
  AsyncStorage.setItem('serein.tasks.v1', JSON.stringify(state));

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('TaskStore', () => {
  it('hydrates from stored state on mount', async () => {
    await seed({
      tasksByTab: { today: [{ label: 'stored', checked: false }], upcoming: [], someday: [] },
      lastOpenedDate: todayString(),
    });

    const { result } = renderHook(useBoth, { wrapper });

    await waitFor(() => expect(result.current.today.tasks).toHaveLength(1));
    expect(result.current.today.tasks[0].label).toBe('stored');
  });

  it('applies the daily rollover on load when the day has changed', async () => {
    await seed({
      tasksByTab: {
        today: [
          { label: 'done', checked: true },
          { label: 'undone', checked: false },
        ],
        upcoming: [],
        someday: [],
      },
      lastOpenedDate: '2020-01-01',
    });

    const { result } = renderHook(useBoth, { wrapper });

    await waitFor(() => expect(result.current.today.tasks).toHaveLength(1));
    expect(result.current.today.tasks[0]).toEqual({
      label: 'undone',
      checked: false,
      carriedOver: true,
    });
  });

  it('editTask rewrites a task label in place', async () => {
    await seed({
      tasksByTab: { today: [{ label: 'old words', checked: false }], upcoming: [], someday: [] },
      lastOpenedDate: todayString(),
    });

    const { result } = renderHook(useBoth, { wrapper });
    await waitFor(() => expect(result.current.today.tasks).toHaveLength(1));

    act(() => {
      result.current.today.editTask(0, 0, 'new words');
    });

    expect(result.current.today.tasks).toEqual([{ label: 'new words', checked: false }]);
  });

  it('promoteTask moves a Today task to Upcoming and clears the carriedOver flag', async () => {
    await seed({
      tasksByTab: {
        today: [{ label: 'carry', checked: false, carriedOver: true }],
        upcoming: [],
        someday: [],
      },
      lastOpenedDate: todayString(),
    });

    const { result } = renderHook(useBoth, { wrapper });
    await waitFor(() => expect(result.current.today.tasks).toHaveLength(1));

    act(() => {
      result.current.today.promoteTask(0);
    });

    expect(result.current.today.tasks).toHaveLength(0);
    expect(result.current.upcoming.tasks).toEqual([{ label: 'carry', checked: false }]);
  });
});
