import Constants from 'expo-constants';
import React, { createContext, ReactNode, use, useEffect, useMemo, useState } from 'react';
import { decideUpdateState } from '@/lib/updateState';
import { fetchAppConfig } from '@/lib/sanity';
import { loadCachedConfig, saveCachedConfig } from './appConfigStorage';
import { AppConfig, DEFAULT_APP_CONFIG } from '@/types/appConfig';

type AppConfigValue = {
  config: AppConfig;
  updateState: 'blocked' | 'nudge' | 'none';
};

const AppConfigContext = createContext<AppConfigValue | null>(null);

export function AppConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_APP_CONFIG);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const cached = await loadCachedConfig();
      if (!cancelled && cached) setConfig(cached);

      const live = await fetchAppConfig();
      if (!cancelled && live) {
        setConfig(live);
        saveCachedConfig(live);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const currentVersion = Constants.expoConfig?.version ?? '0.0.0';
  const value = useMemo(
    () => ({ config, updateState: decideUpdateState(config, currentVersion) }),
    [config, currentVersion]
  );

  return <AppConfigContext.Provider value={value}>{children}</AppConfigContext.Provider>;
}

export function useAppConfig() {
  const store = use(AppConfigContext);
  if (!store) throw new Error('useAppConfig must be used within <AppConfigProvider>');
  return store;
}
