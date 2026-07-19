export const SANITY_PROJECT_ID = 'q7x4fyiu';

// __DEV__ only distinguishes "running through Metro" from everything else —
// it's false in BOTH a preview and a production EAS build (both compile the
// JS bundle in release mode), so it can't tell those two apart. Each build
// profile in eas.json instead sets EXPO_PUBLIC_SANITY_DATASET explicitly
// (development for dev + preview builds, production for the real release),
// which Expo inlines into the bundle at build time. __DEV__ remains the
// fallback for plain `expo start`, where no EAS env is baked in.
export const SANITY_DATASET =
  (process.env.EXPO_PUBLIC_SANITY_DATASET as 'development' | 'production' | undefined) ??
  (__DEV__ ? 'development' : 'production');
export const SANITY_API_VERSION = '2024-01-01';

// Android package is known; iOS id is assigned at first App Store Connect submit.
export const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.shreyas.serein';
export const APP_STORE_URL = 'https://apps.apple.com/app/idREPLACE_WITH_APPLE_ID';
