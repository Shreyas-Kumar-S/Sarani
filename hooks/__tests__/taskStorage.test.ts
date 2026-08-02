import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadTasks, saveTasks, todayString, PersistedState } from '../taskStorage';

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('taskStorage', () => {
  it('round-trips saved state through load', async () => {
    const state: PersistedState = {
      tasksByTab: {
        today: [{ label: 'breathe', checked: false }],
        upcoming: [{ label: 'walk', checked: true }],
        someday: [],
      },
      lastOpenedDate: '2026-07-02',
    };

    await saveTasks(state);
    const loaded = await loadTasks();

    expect(loaded).toEqual(state);
  });

  it('returns null when nothing is stored (first run)', async () => {
    expect(await loadTasks()).toBeNull();
  });

  it('returns null on malformed stored data', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    await AsyncStorage.setItem('sarani.tasks.v1', 'not json{');

    expect(await loadTasks()).toBeNull();
    expect(warn).toHaveBeenCalled();

    warn.mockRestore();
  });

  it('merges over empty defaults so a missing tab key never crashes', async () => {
    await AsyncStorage.setItem(
      'sarani.tasks.v1',
      JSON.stringify({ tasksByTab: { today: [{ label: 'x' }] }, lastOpenedDate: '2026-07-02' })
    );

    const loaded = await loadTasks();

    expect(loaded?.tasksByTab.upcoming).toEqual([]);
    expect(loaded?.tasksByTab.someday).toEqual([]);
  });

  it('formats a date as local YYYY-MM-DD', () => {
    expect(todayString(new Date(2026, 6, 2))).toBe('2026-07-02');
    expect(todayString(new Date(2026, 0, 9))).toBe('2026-01-09');
  });
});
