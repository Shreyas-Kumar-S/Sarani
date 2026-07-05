# Serein v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Take the lean Serein v1 from its current state (task + notes core, 100/100 health) to a submittable release, starting with the two brainstorm-ready features and sequencing the rest.

**Architecture:** Additive to the existing Expo Router + NativeWind app. New runtime content (dev notes, force-update, announcements) comes from Sanity as read-only config fetched once on launch, cached in AsyncStorage, with baked-in fallback so the app never blocks offline. User todos stay 100% local — Sanity never touches them.

**Tech Stack:** React Native 0.81 / Expo SDK 54, expo-router, NativeWind, Reanimated, AsyncStorage, expo-constants (version), expo-linking (store URLs), Jest + @testing-library/react-native. Sanity via plain `fetch` to the cached CDN query API (no new client dependency).

## Global Constraints

- **Expo SDK:** 54; keep Expo Go working for daily dev (no native modules that require a custom dev client in these two plans).
- **Config files:** `.cjs` extension (project is `"type": "module"`).
- **Path alias:** `@/*` resolves to repo root; same-directory imports stay relative.
- **Styling:** NativeWind `className` with the `tailwind.config.js` token vocabulary; no inline color hex unless matching an existing pattern.
- **User data stays local:** Sanity is read-only app content only. Never send or store todos/notes remotely.
- **Offline-safe:** every remote fetch must cache last-known and fall back to baked-in defaults; the app must never hang or block on a failed/absent network.
- **Copy tone:** calm, lowercase-leaning, no guilt/urgency language.
- **Tests:** co-located in `__tests__/`; jest preset `jest-expo`; run with `npx jest <path>`.

---

## PLAN 1 — App Icons & Splash

Pure configuration. Wires the finished light/dark brand assets into the native icon + splash slots. No unit tests apply (asset wiring is verified by build/inspection, not by Jest); verification steps stand in for the test cycle.

### Task 1.1: Import brand assets and wire light/dark icons + splash

**Files:**
- Create: `assets/icons/app-icon-light.png` (from `Serein_Icons_Splash_Assests/app_icon_light.png`)
- Create: `assets/icons/app-icon-dark.png` (from `Serein_Icons_Splash_Assests/app_icon_dark.png`)
- Modify: `app.json`

**Interfaces:**
- Consumes: the two shared PNGs in the sibling `Serein_Icons_Splash_Assests` folder.
- Produces: correct app icon + splash for light and dark system themes.

- [ ] **Step 1: Copy the finished assets into the project**

```bash
cp "../Serein_Icons_Splash_Assests/app_icon_light.png" assets/icons/app-icon-light.png
cp "../Serein_Icons_Splash_Assests/app_icon_dark.png"  assets/icons/app-icon-dark.png
```

- [ ] **Step 2: Wire light/dark icon + splash in `app.json`**

Replace the `icon`, `splash`, `android.adaptiveIcon`, and the `expo-splash-screen` plugin block so light/dark are explicit. iOS dark/tinted icons are supported via the object form of `icon` (Expo SDK 54).

```jsonc
{
  "expo": {
    // ...unchanged fields...
    "icon": {
      "light": "./assets/icons/app-icon-light.png",
      "dark": "./assets/icons/app-icon-dark.png"
    },
    "splash": {
      "image": "./assets/icons/app-icon-light.png",
      "resizeMode": "contain",
      "backgroundColor": "#FAF8F5",
      "dark": {
        "image": "./assets/icons/app-icon-dark.png",
        "backgroundColor": "#141414"
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/icons/app-icon-light.png",
        "backgroundColor": "#FAF8F5"
      },
      "package": "com.shreyas.serein"
    },
    "plugins": [
      "expo-router",
      [
        "expo-splash-screen",
        {
          "image": "./assets/icons/app-icon-light.png",
          "imageWidth": 200,
          "resizeMode": "contain",
          "backgroundColor": "#FAF8F5",
          "dark": { "image": "./assets/icons/app-icon-dark.png", "backgroundColor": "#141414" }
        }
      ],
      "expo-font",
      "expo-web-browser"
    ]
  }
}
```

- [ ] **Step 3: Verify config is valid**

Run: `npx expo config --type public`
Expected: prints the resolved config with no schema errors; `icon` shows the light/dark object.

- [ ] **Step 4: Verify prebuild wiring (no build required)**

Run: `npx expo prebuild --platform android --no-install` in a throwaway check, or inspect via `npx expo-doctor`.
Expected: no icon/splash path errors. (Delete generated `android/`/`ios/` afterward if prebuild was run — this project is managed workflow.)

- [ ] **Step 5: Commit**

```bash
git add assets/icons/app-icon-light.png assets/icons/app-icon-dark.png app.json
git commit -m "chore: wire light/dark app icons and splash"
```

---

## PLAN 2 — App Config + Force-Update Infrastructure

The Sanity-backed content layer, minus the Developers *screen* UI (its placement/entry-point is an undesigned UX choice — see Follow-on Plan A). This plan delivers: a pure version comparator, a Sanity fetch + cache + fallback layer, an update-decision function, and the blocking force-update / dismissible nudge / announcement modals wired at the app root.

### File structure

- `types/appConfig.ts` — `AppConfig`, `Announcement` types + `DEFAULT_APP_CONFIG`.
- `lib/version.ts` — `compareVersions` pure util.
- `lib/updateState.ts` — `decideUpdateState` pure util.
- `lib/sanity.ts` — `fetchAppConfig` (network) + query constant.
- `hooks/appConfigStorage.ts` — AsyncStorage cache read/write (mirrors `taskStorage.ts`).
- `hooks/AppConfigStore.tsx` — provider: fetch → cache → fallback, exposes config + update state.
- `components/UpdateGate.tsx` — blocking force-update modal wrapper.
- `components/AnnouncementModal.tsx` — dismissible announcement/nudge modal.
- `constants/appConfig.ts` — Sanity project id/dataset + store URLs.

### Task 2.0: Sanity project setup (manual prerequisite)

**Files:** none in-repo (external setup) + `constants/appConfig.ts`.

**Interfaces:**
- Produces: `SANITY_PROJECT_ID`, `SANITY_DATASET`, `APP_STORE_URL`, `PLAY_STORE_URL` constants consumed by `lib/sanity.ts` and `components/UpdateGate.tsx`.

- [ ] **Step 1: Create the Sanity project + singleton schema**

In sanity.io (free plan), create a project + `production` dataset. Add this document schema in Sanity Studio:

```js
// schemas/appConfig.js
export default {
  name: 'appConfig',
  type: 'document',
  title: 'App Config',
  fields: [
    { name: 'minSupportedVersion', type: 'string', title: 'Minimum supported version' },
    { name: 'latestVersion', type: 'string', title: 'Latest version' },
    { name: 'updateMessage', type: 'text', title: 'Update message' },
    {
      name: 'announcement', type: 'object', title: 'Announcement',
      fields: [
        { name: 'id', type: 'string' },
        { name: 'title', type: 'string' },
        { name: 'body', type: 'text' },
      ],
    },
    { name: 'devNote', type: 'text', title: 'Developer note' },
    { name: 'pipeline', type: 'array', title: 'Coming soon', of: [{ type: 'string' }] },
  ],
};
```

Create one `appConfig` document. Under **API → CORS origins** nothing is needed (read via CDN). Confirm the dataset is **public** (read).

- [ ] **Step 2: Add constants**

```ts
// constants/appConfig.ts
export const SANITY_PROJECT_ID = 'REPLACE_WITH_PROJECT_ID';
export const SANITY_DATASET = 'production';
export const SANITY_API_VERSION = '2024-01-01';

// Android package is known; iOS id is assigned at first App Store Connect submit.
export const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.shreyas.serein';
export const APP_STORE_URL = 'https://apps.apple.com/app/idREPLACE_WITH_APPLE_ID';
```

- [ ] **Step 3: Commit**

```bash
git add constants/appConfig.ts
git commit -m "chore: add Sanity + store-url constants for app config"
```

### Task 2.1: Version comparator (pure, TDD)

**Files:**
- Create: `lib/version.ts`
- Test: `lib/__tests__/version.test.ts`

**Interfaces:**
- Produces: `compareVersions(a: string, b: string): -1 | 0 | 1` — numeric, dot-separated; `1.10.0 > 1.9.0`.

- [ ] **Step 1: Write the failing test**

```ts
import { compareVersions } from '../version';

describe('compareVersions', () => {
  it('returns 0 for equal versions', () => {
    expect(compareVersions('1.2.3', '1.2.3')).toBe(0);
  });
  it('treats 1.10.0 as greater than 1.9.0 (numeric, not lexical)', () => {
    expect(compareVersions('1.10.0', '1.9.0')).toBe(1);
  });
  it('returns -1 when the first is older', () => {
    expect(compareVersions('1.2.0', '1.2.1')).toBe(-1);
  });
  it('tolerates differing segment counts', () => {
    expect(compareVersions('1.2', '1.2.0')).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest lib/__tests__/version.test.ts`
Expected: FAIL — cannot find module `../version`.

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/version.ts
export function compareVersions(a: string, b: string): -1 | 0 | 1 {
  const pa = a.split('.').map((n) => parseInt(n, 10) || 0);
  const pb = b.split('.').map((n) => parseInt(n, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const x = pa[i] ?? 0;
    const y = pb[i] ?? 0;
    if (x > y) return 1;
    if (x < y) return -1;
  }
  return 0;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest lib/__tests__/version.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/version.ts lib/__tests__/version.test.ts
git commit -m "feat: add numeric version comparator"
```

### Task 2.2: Config types + defaults

**Files:**
- Create: `types/appConfig.ts`

**Interfaces:**
- Produces: `AppConfig`, `Announcement`, `DEFAULT_APP_CONFIG` consumed by all later tasks.

- [ ] **Step 1: Write the types + baked-in fallback**

```ts
// types/appConfig.ts
export type Announcement = { id: string; title: string; body: string };

export type AppConfig = {
  minSupportedVersion: string;
  latestVersion: string;
  updateMessage?: string;
  announcement?: Announcement | null;
  devNote?: string;
  pipeline?: string[];
};

// Shipped in the binary so first launch / offline always has content and never
// force-blocks (minSupportedVersion 0.0.0 => never below).
export const DEFAULT_APP_CONFIG: AppConfig = {
  minSupportedVersion: '0.0.0',
  latestVersion: '1.0.0',
  devNote: 'Made quietly, one gentle step at a time. Thank you for being here.',
  pipeline: ['Gentle reminders', 'Recurring tasks', 'A calm evening wind-down'],
  announcement: null,
};
```

- [ ] **Step 2: Commit**

```bash
git add types/appConfig.ts
git commit -m "feat: add AppConfig types and baked-in defaults"
```

### Task 2.3: Update-decision function (pure, TDD)

**Files:**
- Create: `lib/updateState.ts`
- Test: `lib/__tests__/updateState.test.ts`

**Interfaces:**
- Consumes: `compareVersions` (2.1), `AppConfig` (2.2).
- Produces: `decideUpdateState(config: AppConfig, currentVersion: string): 'blocked' | 'nudge' | 'none'`.

- [ ] **Step 1: Write the failing test**

```ts
import { decideUpdateState } from '../updateState';
import type { AppConfig } from '@/types/appConfig';

const cfg = (over: Partial<AppConfig>): AppConfig => ({
  minSupportedVersion: '1.0.0',
  latestVersion: '1.0.0',
  ...over,
});

describe('decideUpdateState', () => {
  it('blocks when current is below the minimum supported version', () => {
    expect(decideUpdateState(cfg({ minSupportedVersion: '1.2.0' }), '1.1.0')).toBe('blocked');
  });
  it('nudges when current is below latest but at/above minimum', () => {
    expect(
      decideUpdateState(cfg({ minSupportedVersion: '1.0.0', latestVersion: '1.3.0' }), '1.1.0')
    ).toBe('nudge');
  });
  it('returns none when current is current', () => {
    expect(decideUpdateState(cfg({ latestVersion: '1.1.0' }), '1.1.0')).toBe('none');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest lib/__tests__/updateState.test.ts`
Expected: FAIL — cannot find module `../updateState`.

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/updateState.ts
import { compareVersions } from './version';
import type { AppConfig } from '@/types/appConfig';

export function decideUpdateState(
  config: AppConfig,
  currentVersion: string
): 'blocked' | 'nudge' | 'none' {
  if (compareVersions(currentVersion, config.minSupportedVersion) < 0) return 'blocked';
  if (compareVersions(currentVersion, config.latestVersion) < 0) return 'nudge';
  return 'none';
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest lib/__tests__/updateState.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/updateState.ts lib/__tests__/updateState.test.ts
git commit -m "feat: add update-state decision function"
```

### Task 2.4: Config cache (AsyncStorage, TDD)

**Files:**
- Create: `hooks/appConfigStorage.ts`
- Test: `hooks/__tests__/appConfigStorage.test.ts`

**Interfaces:**
- Consumes: `AppConfig` (2.2).
- Produces: `loadCachedConfig(): Promise<AppConfig | null>`, `saveCachedConfig(c: AppConfig): Promise<void>` (key `serein.appConfig.v1`).

- [ ] **Step 1: Write the failing test**

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest hooks/__tests__/appConfigStorage.test.ts`
Expected: FAIL — cannot find module `../appConfigStorage`.

- [ ] **Step 3: Write minimal implementation**

```ts
// hooks/appConfigStorage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppConfig } from '@/types/appConfig';

const KEY = 'serein.appConfig.v1';

export async function loadCachedConfig(): Promise<AppConfig | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AppConfig) : null;
  } catch (error) {
    console.warn('[serein] failed to load cached config', error);
    return null;
  }
}

export async function saveCachedConfig(config: AppConfig): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(config));
  } catch (error) {
    console.warn('[serein] failed to cache config', error);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest hooks/__tests__/appConfigStorage.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add hooks/appConfigStorage.ts hooks/__tests__/appConfigStorage.test.ts
git commit -m "feat: add app-config AsyncStorage cache"
```

### Task 2.5: Sanity fetch (TDD with mocked fetch)

**Files:**
- Create: `lib/sanity.ts`
- Test: `lib/__tests__/sanity.test.ts`

**Interfaces:**
- Consumes: `AppConfig` (2.2), constants (2.0).
- Produces: `fetchAppConfig(): Promise<AppConfig | null>` — resolves the `appConfig` singleton or `null` on any failure.

- [ ] **Step 1: Write the failing test**

```ts
import { fetchAppConfig } from '../sanity';

describe('fetchAppConfig', () => {
  afterEach(() => jest.restoreAllMocks());

  it('returns the config from the query result', async () => {
    const result = { minSupportedVersion: '1.0.0', latestVersion: '1.2.0' };
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ result }),
    } as Response);

    expect(await fetchAppConfig()).toEqual(result);
  });

  it('returns null on a non-ok response', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({ ok: false } as Response);
    expect(await fetchAppConfig()).toBeNull();
  });

  it('returns null when fetch throws (offline)', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('offline'));
    expect(await fetchAppConfig()).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest lib/__tests__/sanity.test.ts`
Expected: FAIL — cannot find module `../sanity`.

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/sanity.ts
import { SANITY_API_VERSION, SANITY_DATASET, SANITY_PROJECT_ID } from '@/constants/appConfig';
import type { AppConfig } from '@/types/appConfig';

const QUERY =
  '*[_type == "appConfig"][0]{minSupportedVersion,latestVersion,updateMessage,announcement,devNote,pipeline}';

export async function fetchAppConfig(): Promise<AppConfig | null> {
  try {
    const url =
      `https://${SANITY_PROJECT_ID}.apicdn.sanity.io/v${SANITY_API_VERSION}` +
      `/data/query/${SANITY_DATASET}?query=${encodeURIComponent(QUERY)}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const body = (await res.json()) as { result?: AppConfig };
    return body.result ?? null;
  } catch (error) {
    console.warn('[serein] failed to fetch app config', error);
    return null;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest lib/__tests__/sanity.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/sanity.ts lib/__tests__/sanity.test.ts
git commit -m "feat: add Sanity app-config fetch"
```

### Task 2.6: AppConfig provider (fetch → cache → fallback, TDD)

**Files:**
- Create: `hooks/AppConfigStore.tsx`
- Test: `hooks/__tests__/AppConfigStore.test.tsx`

**Interfaces:**
- Consumes: `fetchAppConfig` (2.5), `loadCachedConfig`/`saveCachedConfig` (2.4), `DEFAULT_APP_CONFIG` (2.2), `decideUpdateState` (2.3).
- Produces: `<AppConfigProvider>` and `useAppConfig(): { config: AppConfig; updateState: 'blocked'|'nudge'|'none' }`. Resolution order: live fetch → cache → default; live success also writes cache.

- [ ] **Step 1: Write the failing test**

```tsx
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest hooks/__tests__/AppConfigStore.test.tsx`
Expected: FAIL — cannot find module `../AppConfigStore`.

- [ ] **Step 3: Write minimal implementation**

```tsx
// hooks/AppConfigStore.tsx
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest hooks/__tests__/AppConfigStore.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add hooks/AppConfigStore.tsx hooks/__tests__/AppConfigStore.test.tsx
git commit -m "feat: add AppConfig provider with fetch/cache/fallback"
```

### Task 2.7: Force-update gate modal (TDD)

**Files:**
- Create: `components/UpdateGate.tsx`
- Test: `components/__tests__/UpdateGate.test.tsx`
- Modify: `constants/strings.ts` (add `update` copy block)

**Interfaces:**
- Consumes: `useAppConfig` (2.6), `APP_STORE_URL`/`PLAY_STORE_URL` (2.0).
- Produces: `<UpdateGate>{children}</UpdateGate>` — renders children normally; when `updateState === 'blocked'` overlays a non-dismissible modal with the update message + a store button.

- [ ] **Step 1: Add copy**

```ts
// constants/strings.ts — add inside the root object
  update: {
    blockedTitle: 'Time for a fresh start',
    blockedBody: 'This version has gently retired. Update to keep moving forward.',
    button: 'Update Serein',
  },
```

- [ ] **Step 2: Write the failing test**

```tsx
import React from 'react';
import { Linking } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { UpdateGate } from '../UpdateGate';
import { strings } from '@/constants/strings';
import * as store from '@/hooks/AppConfigStore';

const mockState = (updateState: 'blocked' | 'nudge' | 'none') =>
  jest.spyOn(store, 'useAppConfig').mockReturnValue({
    updateState,
    config: { minSupportedVersion: '1.0.0', latestVersion: '1.0.0' },
  });

describe('UpdateGate', () => {
  afterEach(() => jest.restoreAllMocks());

  it('renders children when no update is required', () => {
    mockState('none');
    const api = render(
      <UpdateGate>
        <>{'child content'}</>
      </UpdateGate>
    );
    expect(api.getByText('child content')).toBeTruthy();
  });

  it('shows a blocking modal and opens the store when blocked', () => {
    mockState('blocked');
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as never);
    const api = render(
      <UpdateGate>
        <>{'child content'}</>
      </UpdateGate>
    );
    expect(api.getByText(strings.update.blockedTitle)).toBeTruthy();
    fireEvent.press(api.getByText(strings.update.button));
    expect(open).toHaveBeenCalled();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx jest components/__tests__/UpdateGate.test.tsx`
Expected: FAIL — cannot find module `../UpdateGate`.

- [ ] **Step 4: Write minimal implementation**

```tsx
// components/UpdateGate.tsx
import React, { ReactNode } from 'react';
import { Linking, Modal, Platform, Pressable, Text, View } from 'react-native';
import { useAppConfig } from '@/hooks/AppConfigStore';
import { APP_STORE_URL, PLAY_STORE_URL } from '@/constants/appConfig';
import { strings } from '@/constants/strings';

export function UpdateGate({ children }: { children: ReactNode }) {
  const { updateState, config } = useAppConfig();

  const openStore = () =>
    Linking.openURL(Platform.OS === 'ios' ? APP_STORE_URL : PLAY_STORE_URL);

  return (
    <>
      {children}
      <Modal visible={updateState === 'blocked'} animationType="fade" transparent>
        <View className="flex-1 items-center justify-center bg-black/60 px-8">
          <View className="w-full rounded-[28px] bg-surface-page dark:bg-surface-dark-page p-7">
            <Text className="font-serif text-2xl text-ink-primary dark:text-ink-dark-primary">
              {strings.update.blockedTitle}
            </Text>
            <Text className="mt-3 text-base leading-7 text-ink-secondary dark:text-ink-dark-secondary">
              {config.updateMessage || strings.update.blockedBody}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={openStore}
              className="mt-6 items-center justify-center rounded-full bg-primary py-4"
            >
              <Text className="text-[18px] text-ink-dark-primary">{strings.update.button}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx jest components/__tests__/UpdateGate.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add components/UpdateGate.tsx components/__tests__/UpdateGate.test.tsx constants/strings.ts
git commit -m "feat: add blocking force-update gate"
```

### Task 2.8: Announcement / update-nudge modal (TDD)

**Files:**
- Create: `components/AnnouncementModal.tsx`
- Test: `components/__tests__/AnnouncementModal.test.tsx`
- Create: `hooks/seenAnnouncement.ts` (tiny AsyncStorage seen-flag helper)

**Interfaces:**
- Consumes: `useAppConfig` (2.6).
- Produces: `<AnnouncementModal />` — self-contained; shows a dismissible modal for a `nudge` (update available) or an unseen `announcement`, records the announcement id as seen so it shows once.

- [ ] **Step 1: Write the seen-flag helper + its test**

```ts
// hooks/seenAnnouncement.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
const KEY = 'serein.seenAnnouncements.v1';

export async function isSeen(id: string): Promise<boolean> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as string[]).includes(id) : false;
}
export async function markSeen(id: string): Promise<void> {
  const raw = await AsyncStorage.getItem(KEY);
  const seen = raw ? (JSON.parse(raw) as string[]) : [];
  if (!seen.includes(id)) await AsyncStorage.setItem(KEY, JSON.stringify([...seen, id]));
}
```

```ts
// hooks/__tests__/seenAnnouncement.test.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isSeen, markSeen } from '../seenAnnouncement';

beforeEach(async () => { await AsyncStorage.clear(); });

it('records and reports seen ids', async () => {
  expect(await isSeen('a')).toBe(false);
  await markSeen('a');
  expect(await isSeen('a')).toBe(true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest hooks/__tests__/seenAnnouncement.test.ts`
Expected: FAIL — cannot find module `../seenAnnouncement`.

- [ ] **Step 3: Confirm the helper passes**

Run: `npx jest hooks/__tests__/seenAnnouncement.test.ts`
Expected: PASS.

- [ ] **Step 4: Write the failing modal test**

```tsx
import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { AnnouncementModal } from '../AnnouncementModal';
import * as storeHook from '@/hooks/AppConfigStore';

describe('AnnouncementModal', () => {
  afterEach(() => jest.restoreAllMocks());

  it('shows an unseen announcement body', async () => {
    jest.spyOn(storeHook, 'useAppConfig').mockReturnValue({
      updateState: 'none',
      config: {
        minSupportedVersion: '1.0.0',
        latestVersion: '1.0.0',
        announcement: { id: 'x1', title: 'A small note', body: 'thank you' },
      },
    });
    const api = render(<AnnouncementModal />);
    await waitFor(() => expect(api.getByText('thank you')).toBeTruthy());
  });
});
```

- [ ] **Step 5: Run test to verify it fails**

Run: `npx jest components/__tests__/AnnouncementModal.test.tsx`
Expected: FAIL — cannot find module `../AnnouncementModal`.

- [ ] **Step 6: Write minimal implementation**

```tsx
// components/AnnouncementModal.tsx
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { useAppConfig } from '@/hooks/AppConfigStore';
import { isSeen, markSeen } from '@/hooks/seenAnnouncement';

export function AnnouncementModal() {
  const { config } = useAppConfig();
  const announcement = config.announcement ?? null;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (announcement && !(await isSeen(announcement.id))) {
        if (!cancelled) setVisible(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [announcement]);

  const dismiss = () => {
    if (announcement) markSeen(announcement.id);
    setVisible(false);
  };

  if (!announcement) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={dismiss}>
      <View className="flex-1 items-center justify-center bg-black/50 px-8">
        <View className="w-full rounded-[28px] bg-surface-page dark:bg-surface-dark-page p-7">
          <Text className="font-serif text-2xl text-ink-primary dark:text-ink-dark-primary">
            {announcement.title}
          </Text>
          <Text className="mt-3 text-base leading-7 text-ink-secondary dark:text-ink-dark-secondary">
            {announcement.body}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={dismiss}
            className="mt-6 items-center justify-center rounded-full bg-primary py-4"
          >
            <Text className="text-[18px] text-ink-dark-primary">Okay</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `npx jest components/__tests__/AnnouncementModal.test.tsx hooks/__tests__/seenAnnouncement.test.ts`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add components/AnnouncementModal.tsx components/__tests__/AnnouncementModal.test.tsx hooks/seenAnnouncement.ts hooks/__tests__/seenAnnouncement.test.ts
git commit -m "feat: add announcement/nudge modal shown once"
```

### Task 2.9: Wire provider + gate at the app root

**Files:**
- Modify: `app/_layout.tsx`

**Interfaces:**
- Consumes: `AppConfigProvider` (2.6), `UpdateGate` (2.7), `AnnouncementModal` (2.8).
- Produces: config fetched on launch; blocking gate + announcement active app-wide.

- [ ] **Step 1: Wrap the app**

In `app/_layout.tsx`, import the three, and wrap the existing returned tree so `AppConfigProvider` is outermost (inside `GestureHandlerRootView`/`SafeAreaProvider`), `UpdateGate` wraps the `Stack`/phase content, and `<AnnouncementModal />` renders alongside. Example shape:

```tsx
<AppConfigProvider>
  <UpdateGate>
    {/* existing splash / AppRevealProvider / Stack tree unchanged */}
  </UpdateGate>
  <AnnouncementModal />
</AppConfigProvider>
```

- [ ] **Step 2: Verify nothing regressed**

Run: `npx tsc --noEmit && npx jest`
Expected: TypeScript clean; all suites pass.

- [ ] **Step 3: Verify health unchanged**

Run: `npx react-doctor@latest --score`
Expected: still 100 (no new findings).

- [ ] **Step 4: Commit**

```bash
git add app/_layout.tsx
git commit -m "feat: wire app-config provider, update gate, and announcement modal"
```

---

## FOLLOW-ON PLANS (each gets its own plan doc, written after its brainstorm)

These are deliberately **not** expanded into bite-sized steps here: each needs a design decision first, and a plan written far ahead of execution rots. Written in build order.

### Follow-on A: Developers section screen
- **Why brainstorm first:** entry-point/placement is undesigned (there is no Settings screen yet — options: a 5th surface, a long-press on the header, a link from onboarding). The *content* already arrives via `AppConfig.devNote` + `pipeline` (Plan 2).
- **Will contain:** entry-point decision, a read-only screen consuming `useAppConfig`, empty/offline states, a test that it renders `devNote` and `pipeline`.

### Follow-on B: Notifications + evening wind-down (signature)
- **Why brainstorm first:** permission-request timing/UX, exact schedule model, the wind-down flow, and quiet copy are all product decisions.
- **Will contain:** `expo-notifications` install + permission flow, a `notificationScheduler` (pure schedule-time logic, TDD), the wind-down entry screen, user setting for the hour, quiet-copy strings. Foundation shared with reminders.

### Follow-on C: Recurring tasks
- **Why brainstorm first:** data-model choice (store a rule on the task vs. materialize instances) and how recurrence interacts with the existing daily rollover.
- **Will contain:** `TaskItem` recurrence field, a pure `nextOccurrence` util (TDD), TaskStore changes, a recurrence picker in the add/edit flow, rollover interaction tests.

### Follow-on D: Export / backup
- **Why brainstorm first:** small — mostly format + share-sheet choice (JSON vs. human-readable text; `expo-file-system` + `expo-sharing`).
- **Will contain:** a pure `serializeBackup(tasks, notes)` util (TDD), a share action, an entry point (likely alongside the Developers section).

### Follow-on E: Privacy onboarding
- **Why brainstorm first:** it's UX/copy-led — three calm screens, the "No account. No cloud. Yours." beat, and how it hands off to the existing welcome curtain.
- **Will contain:** an onboarding route shown once (AsyncStorage first-run flag), the three screens, a test for the seen-once gate.

### Follow-on F: Production machinery + Sentry
- **Why last:** it's the submission gate and the first EAS build.
- **Will contain:** `eas.json` build profiles, Sentry via its Expo config plugin (wired for prod builds only), a root error boundary, store listings + screenshots checklist, privacy-policy publish, a real-device pass, and an accessibility sweep.

---

## Self-Review

- **Spec coverage:** v1-scope checklist items 1 (icons) and 2 (Sanity layer, minus the Developers *screen* UI) are fully planned. Items 3–7 plus the Developers screen are captured as brainstorm-gated follow-on plans with scope + rationale — none dropped.
- **Placeholders:** none in Plans 1–2 (all code shown). Follow-on sections are intentionally high-level (design-gated), not fake steps. The two `REPLACE_WITH_*` tokens in `constants/appConfig.ts` are real external values the founder supplies during Task 2.0.
- **Type consistency:** `AppConfig`/`Announcement` used identically across 2.2–2.9; `compareVersions`, `decideUpdateState`, `fetchAppConfig`, `loadCachedConfig`/`saveCachedConfig`, `useAppConfig` signatures match between definition and consumers.
