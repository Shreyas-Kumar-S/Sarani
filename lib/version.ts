export function compareVersions(a: string, b: string): -1 | 0 | 1 {
  // Coerce non-string input (e.g. null from a partial remote config) to an
  // empty version so this never throws — an empty version parses to [0].
  const toParts = (v: string) => (typeof v === 'string' ? v : '').split('.').map((n) => parseInt(n, 10) || 0);
  const pa = toParts(a);
  const pb = toParts(b);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const x = pa[i] ?? 0;
    const y = pb[i] ?? 0;
    if (x > y) return 1;
    if (x < y) return -1;
  }
  return 0;
}
