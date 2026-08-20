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
      // Backfilled by loadTasks' createdAt migration since the seeded task had none.
      createdAt: todayString(),
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

    expect(result.current.today.tasks).toEqual([
      { label: 'new words', checked: false, createdAt: todayString() },
    ]);
  });

  it('addTask stamps the new task with createdAt', async () => {
    await seed({
      tasksByTab: { today: [], upcoming: [], someday: [] },
      lastOpenedDate: todayString(),
    });

    const { result } = renderHook(useBoth, { wrapper });
    await waitFor(() => expect(result.current.today.tasks).toHaveLength(0));

    act(() => {
      result.current.today.addTask('stretch');
    });

    expect(result.current.today.tasks[0].createdAt).toBe(todayString());
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
    expect(result.current.upcoming.tasks).toEqual([
      // decayed is computed live for the Upcoming tab; a task promoted just
      // now carries today's createdAt, so it isn't decayed yet.
      { label: 'carry', checked: false, createdAt: todayString(), decayed: false },
    ]);
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

  describe('decay tag on stale Upcoming tasks', () => {
    it('flags an unchecked Upcoming task as decayed once it is older than the threshold', async () => {
      await AsyncStorage.setItem(
        'sarani.tasks.v1',
        JSON.stringify({
          tasksByTab: {
            today: [],
            upcoming: [{ label: 'old plan', checked: false, createdAt: '2026-06-01' }],
            someday: [],
          },
          lastOpenedDate: todayString(),
        })
      );

      const { result } = renderHook(useBoth, { wrapper });
      await waitFor(() => expect(result.current.upcoming.tasks).toHaveLength(1));

      expect(result.current.upcoming.tasks[0].decayed).toBe(true);
    });

    it('does not flag a recently-added Upcoming task', async () => {
      await AsyncStorage.setItem(
        'sarani.tasks.v1',
        JSON.stringify({
          tasksByTab: {
            today: [],
            upcoming: [{ label: 'fresh plan', checked: false, createdAt: todayString() }],
            someday: [],
          },
          lastOpenedDate: todayString(),
        })
      );

      const { result } = renderHook(useBoth, { wrapper });
      await waitFor(() => expect(result.current.upcoming.tasks).toHaveLength(1));

      expect(result.current.upcoming.tasks[0].decayed).toBe(false);
    });

    it('never flags a Someday task, regardless of age', async () => {
      await AsyncStorage.setItem(
        'sarani.tasks.v1',
        JSON.stringify({
          tasksByTab: {
            today: [],
            upcoming: [],
            someday: [{ label: 'old someday', checked: false, createdAt: '2026-01-01' }],
          },
          lastOpenedDate: todayString(),
        })
      );

      const { result } = renderHook(useWithHistory, { wrapper });
      await waitFor(() => expect(result.current.someday.tasks).toHaveLength(1));

      expect(result.current.someday.tasks[0].decayed).toBeUndefined();
    });
  });

  describe('completed Upcoming/Someday tasks leave the tab into History', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('removes a checked Upcoming task from the live tab after a short delay', async () => {
      await seed({
        tasksByTab: {
          today: [],
          upcoming: [{ label: 'read a book', checked: false }],
          someday: [],
        },
        lastOpenedDate: todayString(),
      });

      const { result } = renderHook(useBoth, { wrapper });
      await waitFor(() => expect(result.current.upcoming.tasks).toHaveLength(1));

      act(() => {
        result.current.upcoming.toggleTask(0, 0);
      });
      // Still present immediately — the delay is what lets the checkmark be seen.
      expect(result.current.upcoming.tasks).toHaveLength(1);

      act(() => {
        jest.advanceTimersByTime(700);
      });

      expect(result.current.upcoming.tasks).toHaveLength(0);
    });

    it('applies the same delayed removal to Someday', async () => {
      await seed({
        tasksByTab: {
          today: [],
          upcoming: [],
          someday: [{ label: 'learn pottery', checked: false }],
        },
        lastOpenedDate: todayString(),
      });

      const { result } = renderHook(useWithHistory, { wrapper });
      await waitFor(() => expect(result.current.someday.tasks).toHaveLength(1));

      act(() => {
        result.current.someday.toggleTask(0, 0);
      });
      act(() => {
        jest.advanceTimersByTime(700);
      });

      expect(result.current.someday.tasks).toHaveLength(0);
    });

    it('does not remove the task if unchecked again before the delay elapses', async () => {
      await seed({
        tasksByTab: {
          today: [],
          upcoming: [{ label: 'read a book', checked: false }],
          someday: [],
        },
        lastOpenedDate: todayString(),
      });

      const { result } = renderHook(useBoth, { wrapper });
      await waitFor(() => expect(result.current.upcoming.tasks).toHaveLength(1));

      act(() => {
        result.current.upcoming.toggleTask(0, 0);
      });
      act(() => {
        result.current.upcoming.toggleTask(0, 0);
      });
      act(() => {
        jest.advanceTimersByTime(700);
      });

      expect(result.current.upcoming.tasks).toHaveLength(1);
      expect(result.current.upcoming.tasks[0].checked).toBe(false);
    });

    it('schedules removal when promoting an already-completed carried-over task into Upcoming', async () => {
      await seed({
        tasksByTab: {
          today: [{ label: 'carry', checked: true, carriedOver: true }],
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
      expect(result.current.upcoming.tasks).toHaveLength(1);

      act(() => {
        jest.advanceTimersByTime(700);
      });

      expect(result.current.upcoming.tasks).toHaveLength(0);
    });
  });

  describe('sweeps already-checked Upcoming/Someday tasks at load time', () => {
    // The regression that matters: in-session removal only fires from the
    // toggle/promote path (see the delayed-removal describe block above), so
    // a task that was already checked before that feature shipped — or
    // checked in a session killed inside the 700ms delay — would otherwise
    // stay checked in the live tab forever. This is the load-time sweep that
    // catches those.
    it('drops an already-checked Upcoming task on load', async () => {
      await seed({
        tasksByTab: {
          today: [],
          upcoming: [
            { label: 'stale checked', checked: true },
            { label: 'still pending', checked: false },
          ],
          someday: [],
        },
        lastOpenedDate: todayString(),
      });

      const { result } = renderHook(useBoth, { wrapper });

      await waitFor(() => expect(result.current.upcoming.tasks).toHaveLength(1));
      expect(result.current.upcoming.tasks[0].label).toBe('still pending');
    });

    it('drops an already-checked Someday task on load', async () => {
      await seed({
        tasksByTab: {
          today: [],
          upcoming: [],
          someday: [
            { label: 'stale checked', checked: true },
            { label: 'still pending', checked: false },
          ],
        },
        lastOpenedDate: todayString(),
      });

      const { result } = renderHook(useWithHistory, { wrapper });

      await waitFor(() => expect(result.current.someday.tasks).toHaveLength(1));
      expect(result.current.someday.tasks[0].label).toBe('still pending');
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
          { label: 'read', checked: false, createdAt: todayString() },
        ])
      );
      expect(result.current.history.datesWithHistory).toContain(todayString());

      act(() => {
        result.current.today.toggleTask(0, 0);
      });

      await waitFor(() =>
        expect(result.current.history.getDay(todayString())).toEqual([
          { label: 'read', checked: true, createdAt: todayString() },
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
          { label: 'carry', checked: true, createdAt: todayString(), carriedOver: true },
        ])
      );

      act(() => {
        result.current.today.promoteTask(0);
      });

      expect(result.current.today.tasks).toHaveLength(0);
      expect(result.current.upcoming.tasks).toEqual([
        // decayed is computed live for the Upcoming tab; checked tasks never
        // decay, regardless of age.
        { label: 'carry', checked: true, createdAt: todayString(), decayed: false },
      ]);
      // The task is gone from Today's live list, but promoting it must not
      // erase today's record of having finished it. This entry comes from
      // otherCompletions (promoteToUpcoming logs {label, checked} only), not
      // from the promoted task object itself, so it has no createdAt.
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

      expect(result.current.upcoming.tasks).toEqual([
        // decayed is computed live for the Upcoming tab; a task promoted just
        // now carries today's createdAt, so it isn't decayed yet.
        { label: 'defer', checked: false, createdAt: todayString(), decayed: false },
      ]);
      await waitFor(() =>
        expect(result.current.history.datesWithHistory).not.toContain(todayString())
      );
    });
  });
});
