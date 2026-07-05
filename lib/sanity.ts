import axios from 'axios';
import { SANITY_API_VERSION, SANITY_DATASET, SANITY_PROJECT_ID } from '@/constants/appConfig';
import type { AppConfig } from '@/types/appConfig';

const QUERY =
  '*[_type == "appConfig"][0]{minSupportedVersion,latestVersion,updateMessage,announcement,devNote,pipeline}';

// Reads the single app-config document from Sanity's cached CDN endpoint.
// Read-only, tokenless (the dataset is public read) — never sends user data.
// axios throws on non-2xx and on network errors, so both fall through to the
// catch and resolve to null; callers treat null as "use cache/defaults".
export async function fetchAppConfig(): Promise<AppConfig | null> {
  try {
    const url =
      `https://${SANITY_PROJECT_ID}.apicdn.sanity.io/v${SANITY_API_VERSION}` +
      `/data/query/${SANITY_DATASET}`;
    const res = await axios.get<{ result?: AppConfig }>(url, {
      params: { query: QUERY },
      timeout: 8000,
    });
    return res.data.result ?? null;
  } catch (error) {
    console.warn('[serein] failed to fetch app config', error);
    return null;
  }
}
