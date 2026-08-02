import axios from 'axios';
import { SANITY_API_VERSION, SANITY_DATASET, SANITY_PROJECT_ID } from '@/constants/appConfig';
import { AppConfig, DEFAULT_APP_CONFIG, UpcomingFeature } from '@/types/appConfig';

const QUERY =
  '*[_type == "appConfig"][0]{minSupportedVersion,latestVersion,updateMessage,announcement,upcomingFeatures}';

function isUpcomingFeature(v: unknown): v is UpcomingFeature {
  return (
    !!v &&
    typeof v === 'object' &&
    typeof (v as UpcomingFeature).title === 'string' &&
    typeof (v as UpcomingFeature).description === 'string'
  );
}


function normalizeConfig(raw: Record<string, unknown>): AppConfig {
  const str = (v: unknown, fallback: string) => (typeof v === 'string' && v ? v : fallback);
  const config: AppConfig = {
    minSupportedVersion: str(raw.minSupportedVersion, DEFAULT_APP_CONFIG.minSupportedVersion),
    latestVersion: str(raw.latestVersion, DEFAULT_APP_CONFIG.latestVersion),
  };
  if (typeof raw.updateMessage === 'string') config.updateMessage = raw.updateMessage;
  if (raw.announcement) config.announcement = raw.announcement as AppConfig['announcement'];
  if (Array.isArray(raw.upcomingFeatures)) {
    const features = raw.upcomingFeatures.filter(isUpcomingFeature);
    if (features.length > 0) config.upcomingFeatures = features;
  }
  return config;
}

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
    console.warn('[sarani] failed to fetch app config', error);
    return null;
  }
}
