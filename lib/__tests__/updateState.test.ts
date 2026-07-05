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
