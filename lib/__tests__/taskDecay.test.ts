import { daysBetween, isDecayed, DECAY_THRESHOLD_DAYS } from '../taskDecay';

describe('daysBetween', () => {
  it('counts whole calendar days between two local dates', () => {
    expect(daysBetween('2026-07-01', '2026-07-04')).toBe(3);
    expect(daysBetween('2026-07-01', '2026-07-01')).toBe(0);
  });
});

describe('isDecayed', () => {
  it(`is false for a task created ${DECAY_THRESHOLD_DAYS} days ago or fewer`, () => {
    expect(isDecayed({ checked: false, createdAt: '2026-07-01' }, '2026-07-03')).toBe(false);
  });

  it(`is true once a task has sat open more than ${DECAY_THRESHOLD_DAYS} days`, () => {
    expect(isDecayed({ checked: false, createdAt: '2026-07-01' }, '2026-07-04')).toBe(true);
  });

  it('is never true for a completed task, regardless of age', () => {
    expect(isDecayed({ checked: true, createdAt: '2026-01-01' }, '2026-07-04')).toBe(false);
  });

  it('is false when createdAt is missing', () => {
    expect(isDecayed({ checked: false, createdAt: undefined }, '2026-07-04')).toBe(false);
  });
});
