import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadCachedConfig, saveCachedConfig } from '../appConfigStorage';

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('appConfigStorage', () => {
  it('returns null before anything is cached', async () => {
    expect(await loadCachedConfig()).toBeNull();
  });
  it('round-trips a config', async () => {
    const c = { minSupportedVersion: '1.0.0', latestVersion: '1.2.0', devNote: 'hi' };
    await saveCachedConfig(c);
    expect(await loadCachedConfig()).toEqual(c);
  });
  it('treats corrupt cache as empty', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    await AsyncStorage.setItem('serein.appConfig.v1', 'not json {');
    expect(await loadCachedConfig()).toBeNull();
    warn.mockRestore();
  });
});
