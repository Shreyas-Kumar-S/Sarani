import { compareVersions } from '../version';

describe('compareVersions', () => {
  it('returns 0 for equal versions', () => {
    expect(compareVersions('1.2.3', '1.2.3')).toBe(0);
  });
  it('treats 1.10.0 as greater than 1.9.0 (numeric, not lexical)', () => {
    expect(compareVersions('1.10.0', '1.9.0')).toBe(1);
  });
  it('returns -1 when the first is older', () => {
    expect(compareVersions('1.2.0', '1.2.1')).toBe(-1);
  });
  it('tolerates differing segment counts', () => {
    expect(compareVersions('1.2', '1.2.0')).toBe(0);
  });
  it('does not throw on null/undefined input (defensive — treats as empty)', () => {
    expect(compareVersions('1.0.0', null as unknown as string)).toBe(1);
    expect(compareVersions(undefined as unknown as string, '1.0.0')).toBe(-1);
  });
});
