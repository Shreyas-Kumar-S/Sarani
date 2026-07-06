import axios from 'axios';
import { SANITY_API_VERSION, SANITY_DATASET, SANITY_PROJECT_ID } from '@/constants/appConfig';
import { AppConfig, DEFAULT_APP_CONFIG } from '@/types/appConfig';

const QUERY =
  '*[_type == "appConfig"][0]{minSupportedVersion,latestVersion,updateMessage,announcement,devNote,pipeline}';

// Sanity returns null for fields that exist on the document but are empty, so
// the raw result cannot be trusted to match AppConfig. Normalize it here — the
// single trust boundary — so the rest of the app can rely on AppConfig's types
// (notably non-null version strings, which the version comparator splits).
function normalizeConfig(raw: Record<string, unknown>): AppConfig {
  const str = (v: unknown, fallback: string) => (typeof v === 'string' && v ? v : fallback);
  const config: AppConfig = {
    minSupportedVersion: str(raw.minSupportedVersion, DEFAULT_APP_CONFIG.minSupportedVersion),
    latestVersion: str(raw.latestVersion, DEFAULT_APP_CONFIG.latestVersion),
  };
  if (typeof raw.updateMessage === 'string') config.updateMessage = raw.updateMessage;
  if (raw.announcement) config.announcement = raw.announcement as AppConfig['announcement'];
  if (typeof raw.devNote === 'string') config.devNote = raw.devNote;
  if (Array.isArray(raw.pipeline)) config.pipeline = raw.pipeline as string[];
  return config;
}

// Reads the single app-config document from Sanity's cached CDN endpoint.
// Read-only, tokenless (the dataset is public read) — never sends user data.
// axios throws on non-2xx and on network errors, so both fall through to the
// catch and resolve to null; callers treat null as "use cache/defaults".
export async function fetchAppConfig(): Promise<AppConfig | null> {
  try {
    const url =
      `https://${SANITY_PROJECT_ID}.apicdn.sanity.io/v${SANITY_API_VERSION}` +
      `/data/query/${SANITY_DATASET}`;
    const res = await axios.get<{ result?: Record<string, unknown> | null }>(url, {
      params: { query: QUERY },
      timeout: 8000,
    });
    return res.data.result ? normalizeConfig(res.data.result) : null;
  } catch (error) {
    console.warn('[serein] failed to fetch app config', error);
    return null;
  }
}
