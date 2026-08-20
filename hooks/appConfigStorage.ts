import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppConfig } from '@/types/appConfig';

const KEY = 'sarani.appConfig.v1';

export async function loadCachedConfig(): Promise<AppConfig | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AppConfig) : null;
  } catch (error) {
    console.warn('[sarani] failed to load cached config', error);
    return null;
  }
}

export async function saveCachedConfig(config: AppConfig): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(config));
  } catch (error) {
    console.warn('[sarani] failed to cache config', error);
  }
}
