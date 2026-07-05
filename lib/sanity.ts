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
