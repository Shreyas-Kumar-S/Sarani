import React, { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppConfigProvider, useAppConfig } from '../AppConfigStore';
import * as sanity from '@/lib/sanity';

jest.mock('expo-constants', () => ({ expoConfig: { version: '1.1.0' } }));

const wrapper = ({ children }: { children: ReactNode }) => (
  <AppConfigProvider>{children}</AppConfigProvider>
);

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('AppConfigStore', () => {
  it('adopts the live config and computes update state', async () => {
    jest.spyOn(sanity, 'fetchAppConfig').mockResolvedValue({
      minSupportedVersion: '1.2.0',
      latestVersion: '1.2.0',
    });

    const { result } = renderHook(() => useAppConfig(), { wrapper });

    await waitFor(() => expect(result.current.config.minSupportedVersion).toBe('1.2.0'));
    expect(result.current.updateState).toBe('blocked'); // 1.1.0 < 1.2.0
  });

  it('falls back to defaults when offline with no cache', async () => {
    jest.spyOn(sanity, 'fetchAppConfig').mockResolvedValue(null);

    const { result } = renderHook(() => useAppConfig(), { wrapper });

    await waitFor(() => expect(result.current.updateState).toBe('none'));
    expect(result.current.config.minSupportedVersion).toBe('0.0.0');
  });
});
