import axios from 'axios';
import { fetchAppConfig } from '../sanity';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('fetchAppConfig', () => {
  afterEach(() => jest.clearAllMocks());

  it('returns the config from the query result', async () => {
    const result = { minSupportedVersion: '1.0.0', latestVersion: '1.2.0' };
    mockedAxios.get.mockResolvedValue({ data: { result } });

    expect(await fetchAppConfig()).toEqual(result);
  });

  it('returns null when the query result is empty', async () => {
    mockedAxios.get.mockResolvedValue({ data: {} });

    expect(await fetchAppConfig()).toBeNull();
  });

  it('normalizes null/missing version fields to safe defaults (never yields null versions)', async () => {
    mockedAxios.get.mockResolvedValue({
      data: { result: { minSupportedVersion: null, latestVersion: null, updateMessage: 'hi' } },
    });

    expect(await fetchAppConfig()).toEqual({
      minSupportedVersion: '0.0.0',
      latestVersion: '1.0.0',
      updateMessage: 'hi',
    });
  });

  it('keeps well-formed upcomingFeatures and drops malformed entries', async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        result: {
          minSupportedVersion: '1.0.0',
          latestVersion: '1.0.0',
          upcomingFeatures: [
            { title: 'Streaks', description: 'Gentle nudges.' },
            { title: 'No description' },
            'not an object',
            null,
          ],
        },
      },
    });

    expect(await fetchAppConfig()).toEqual({
      minSupportedVersion: '1.0.0',
      latestVersion: '1.0.0',
      upcomingFeatures: [{ title: 'Streaks', description: 'Gentle nudges.' }],
    });
  });

  it('omits upcomingFeatures entirely when the field is empty or every entry is malformed', async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        result: {
          minSupportedVersion: '1.0.0',
          latestVersion: '1.0.0',
          upcomingFeatures: [],
        },
      },
    });

    const config = await fetchAppConfig();
    expect(config?.upcomingFeatures).toBeUndefined();
  });

  it('returns null when the request throws (offline or non-2xx)', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    mockedAxios.get.mockRejectedValue(new Error('offline'));

    expect(await fetchAppConfig()).toBeNull();
    warn.mockRestore();
  });
});
