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
