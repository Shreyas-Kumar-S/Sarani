import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadHistory, PersistedHistory, saveHistory } from '../historyStorage';

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('historyStorage', () => {
  it('round-trips saved state through load', async () => {
    const state: PersistedHistory = {
      todaySnapshots: { '2026-06-14': [{ label: 'read', checked: true }] },
      otherCompletions: { '2026-06-14': [{ label: 'gym', checked: true }] },
    };

    await saveHistory(state);
    const loaded = await loadHistory();

    expect(loaded).toEqual(state);
  });

  it('returns null when nothing is stored (first run)', async () => {
    expect(await loadHistory()).toBeNull();
  });

  it('returns null on malformed stored data', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    await AsyncStorage.setItem('serein.history.v1', 'not json{');

    expect(await loadHistory()).toBeNull();
    expect(warn).toHaveBeenCalled();

    warn.mockRestore();
  });

  it('merges over empty defaults so a missing key never crashes', async () => {
    await AsyncStorage.setItem(
      'serein.history.v1',
      JSON.stringify({ todaySnapshots: { '2026-06-14': [] } })
    );

    const loaded = await loadHistory();

    expect(loaded?.todaySnapshots).toEqual({ '2026-06-14': [] });
    expect(loaded?.otherCompletions).toEqual({});
  });
});
