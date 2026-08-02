import React, { ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TaskProvider, useHistory, useTaskList } from '../TaskStore';
import { todayString } from '../taskStorage';

const wrapper = ({ children }: { children: ReactNode }) => <TaskProvider>{children}</TaskProvider>;

// Render both buckets we care about from a single hook.
const useBoth = () => ({
  today: useTaskList('today'),
  upcoming: useTaskList('upcoming'),
});

const useWithHistory = () => ({
  today: useTaskList('today'),
  upcoming: useTaskList('upcoming'),
  someday: useTaskList('someday'),
  history: useHistory(),
});

const seed = (state: unknown) =>
  AsyncStorage.setItem('sarani.tasks.v1', JSON.stringify(state));

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

  describe('completed tasks sink to the bottom', () => {
    const seedThree = () =>
      seed({
        tasksByTab: {
          today: [
            { label: 'alpha', checked: false },
            { label: 'bravo', checked: true },
            { label: 'charlie', checked: false },
          ],
          upcoming: [],
          someday: [],
        },
        lastOpenedDate: todayString(),
      });

    it('orders unchecked before checked, each keeping insertion order', async () => {
      await seedThree();
      const { result } = renderHook(useBoth, { wrapper });
      await waitFor(() => expect(result.current.today.tasks).toHaveLength(3));

      expect(result.current.today.tasks.map((task) => task.label)).toEqual([
        'alpha',
        'charlie',
        'bravo',
      ]);
    });

    // The regression that matters: mutations are keyed on the *stored* index,
    // so a broken display->stored mapping would silently hit the wrong task
    // rather than throw.
    it('applies mutations to the task at the given display position', async () => {
      await seedThree();
      const { result } = renderHook(useBoth, { wrapper });
      await waitFor(() => expect(result.current.today.tasks).toHaveLength(3));

      // Display index 1 is 'charlie' (stored index 2), not 'bravo'.
      act(() => {
        result.current.today.removeTask(0, 1);
      });

      expect(result.current.today.tasks.map((task) => task.label)).toEqual(['alpha', 'bravo']);
    });

    it('returns a task to its original position when un-checked', async () => {
      await seed({
        tasksByTab: {
          today: [
            { label: 'alpha', checked: false },
            { label: 'bravo', checked: false },
            { label: 'charlie', checked: false },
          ],
          upcoming: [],
          someday: [],
        },
        lastOpenedDate: todayString(),
      });
      const { result } = renderHook(useBoth, { wrapper });
      await waitFor(() => expect(result.current.today.tasks).toHaveLength(3));

      act(() => {
        result.current.today.toggleTask(0, 1);
      });
      expect(result.current.today.tasks.map((task) => task.label)).toEqual([
        'alpha',
        'charlie',
        'bravo',
      ]);

      // 'bravo' now sits at display index 2; un-checking must restore it to
      // the middle, which only holds if stored order was never disturbed.
      act(() => {
        result.current.today.toggleTask(0, 2);
      });
      expect(result.current.today.tasks.map((task) => task.label)).toEqual([
        'alpha',
        'bravo',
        'charlie',
      ]);
    });

    it('leaves history mirroring stored order, not display order', async () => {
      await seed({
        tasksByTab: {
          today: [
            { label: 'alpha', checked: true },
            { label: 'bravo', checked: false },
          ],
          upcoming: [],
          someday: [],
        },
        lastOpenedDate: todayString(),
      });
      const { result } = renderHook(useWithHistory, { wrapper });
      await waitFor(() => expect(result.current.today.tasks).toHaveLength(2));

      expect(result.current.today.tasks.map((task) => task.label)).toEqual(['bravo', 'alpha']);
      await waitFor(() =>
        expect(result.current.history.getDay(todayString()).map((task) => task.label)).toEqual([
          'alpha',
          'bravo',
        ])
      );
    });
  });

  describe('history', () => {
    it("mirrors Today's live list into today's history entry", async () => {
      await seed({
        tasksByTab: { today: [{ label: 'read', checked: false }], upcoming: [], someday: [] },
        lastOpenedDate: todayString(),
      });

      const { result } = renderHook(useWithHistory, { wrapper });
      await waitFor(() => expect(result.current.today.tasks).toHaveLength(1));

      await waitFor(() =>
        expect(result.current.history.getDay(todayString())).toEqual([
          { label: 'read', checked: false },
        ])
      );
      expect(result.current.history.datesWithHistory).toContain(todayString());

      act(() => {
        result.current.today.toggleTask(0, 0);
      });

      await waitFor(() =>
        expect(result.current.history.getDay(todayString())).toEqual([
          { label: 'read', checked: true },
        ])
      );
    });

    it('logs an Upcoming completion into history under today, and un-checking removes it', async () => {
      await seed({
        tasksByTab: {
          today: [],
          upcoming: [{ label: 'read a book', checked: false }],
          someday: [],
        },
        lastOpenedDate: todayString(),
      });

      const { result } = renderHook(useWithHistory, { wrapper });
      await waitFor(() => expect(result.current.upcoming.tasks).toHaveLength(1));

      act(() => {
        result.current.upcoming.toggleTask(0, 0);
      });

      await waitFor(() =>
        expect(result.current.history.getDay(todayString())).toEqual([
          { label: 'read a book', checked: true },
        ])
      );
      expect(result.current.history.datesWithHistory).toContain(todayString());

      act(() => {
        result.current.upcoming.toggleTask(0, 0);
      });

      await waitFor(() => expect(result.current.history.getDay(todayString())).toEqual([]));
      // Today itself is (and stayed) empty, and the one completion that had
      // been logged under it is now gone — the date should drop out of
      // datesWithHistory entirely rather than linger as an empty entry.
      expect(result.current.history.datesWithHistory).not.toContain(todayString());
    });

    it('preserves history when promoting an already-completed carried-over task', async () => {
      await seed({
        tasksByTab: {
          today: [{ label: 'carry', checked: true, carriedOver: true }],
          upcoming: [],
          someday: [],
        },
        lastOpenedDate: todayString(),
      });

      const { result } = renderHook(useWithHistory, { wrapper });
      await waitFor(() => expect(result.current.today.tasks).toHaveLength(1));
      // Pre-promotion, this is mirrored straight from the live Today list,
      // carriedOver flag and all — that flag only gets shed once promoted.
      await waitFor(() =>
        expect(result.current.history.getDay(todayString())).toEqual([
          { label: 'carry', checked: true, carriedOver: true },
        ])
      );

      act(() => {
        result.current.today.promoteTask(0);
      });

      expect(result.current.today.tasks).toHaveLength(0);
      expect(result.current.upcoming.tasks).toEqual([{ label: 'carry', checked: true }]);
      // The task is gone from Today's live list, but promoting it must not
      // erase today's record of having finished it.
      await waitFor(() =>
        expect(result.current.history.getDay(todayString())).toEqual([
          { label: 'carry', checked: true },
        ])
      );
    });

    it('does not log history when promoting a still-unchecked carried-over task', async () => {
      await seed({
        tasksByTab: {
          today: [{ label: 'defer', checked: false, carriedOver: true }],
          upcoming: [],
          someday: [],
        },
        lastOpenedDate: todayString(),
      });

      const { result } = renderHook(useWithHistory, { wrapper });
      await waitFor(() => expect(result.current.today.tasks).toHaveLength(1));

      act(() => {
        result.current.today.promoteTask(0);
      });

      expect(result.current.upcoming.tasks).toEqual([{ label: 'defer', checked: false }]);
      await waitFor(() =>
        expect(result.current.history.datesWithHistory).not.toContain(todayString())
      );
    });
  });
});
