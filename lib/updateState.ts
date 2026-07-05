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
