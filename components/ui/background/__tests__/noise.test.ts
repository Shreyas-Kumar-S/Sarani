import { valueNoise } from '../noise';

const sample = (seed: number, n = 5000, dt = 0.01) =>
  Array.from({ length: n }, (_, i) => valueNoise(i * dt, seed));

describe('valueNoise', () => {
  it('stays within [-1, 1]', () => {
    for (const v of sample(0.37)) {
      expect(v).toBeGreaterThanOrEqual(-1);
      expect(v).toBeLessThanOrEqual(1);
    }
  });

  it('is continuous: a small step in time is a small step in value', () => {
    const values = sample(12.5, 5000, 0.001);
    for (let i = 1; i < values.length; i += 1) {
      expect(Math.abs(values[i] - values[i - 1])).toBeLessThan(0.02);
    }
  });

  it('actually moves, and covers a good part of the range', () => {
    const values = sample(3.3);
    expect(Math.max(...values) - Math.min(...values)).toBeGreaterThan(1);
  });

  it('is deterministic for a seed and different across seeds', () => {
    expect(sample(7)).toEqual(sample(7));
    expect(sample(7)).not.toEqual(sample(8));
  });

  it('does not repeat over a long run', () => {
    // A looping sine retraces itself every period; noise over 200 lattice
    // steps should never reproduce its first stretch.
    const values = sample(0.5, 20000, 0.01);
    const head = values.slice(0, 200).join(',');
    for (let start = 100; start + 200 <= values.length; start += 100) {
      expect(values.slice(start, start + 200).join(',')).not.toEqual(head);
    }
  });
});
