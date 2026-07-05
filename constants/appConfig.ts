export const SANITY_PROJECT_ID = 'q7x4fyiu';
// Dev builds read the `development` dataset so test config never touches
// what real users see; release builds read `production`.
export const SANITY_DATASET = __DEV__ ? 'development' : 'production';
export const SANITY_API_VERSION = '2024-01-01';

// Android package is known; iOS id is assigned at first App Store Connect submit.
export const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.shreyas.serein';
export const APP_STORE_URL = 'https://apps.apple.com/app/idREPLACE_WITH_APPLE_ID';
