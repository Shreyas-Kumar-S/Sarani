// One-dimensional value noise: a random value at every integer, smoothly
// interpolated in between. Output stays within [-1, 1], is continuous, and
// in practice never repeats — unlike the sine loop, which retraces the same
// figure every period. Every function is a worklet so Floater can sample it
// on the UI thread on each frame.

function hash(n: number): number {
  'worklet';
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function smoothstep(t: number): number {
  'worklet';
  return t * t * (3 - 2 * t);
}

/**
 * @param t   time in lattice units — one unit is roughly one "change of mind"
 * @param seed any number; different seeds give unrelated curves
 */
export function valueNoise(t: number, seed: number): number {
  'worklet';
  const x = t + seed;
  const i = Math.floor(x);
  const f = smoothstep(x - i);
  const a = hash(i);
  const b = hash(i + 1);
  return (a + (b - a) * f) * 2 - 1;
}
