import { applyDailyRollover, sweepCompletedFromOtherTabs } from '../rollover';
import type { TabKey } from '../TaskStore';
import { TaskItem } from '@/types/task';

const tabs = (over: Partial<Record<TabKey, TaskItem[]>> = {}): Record<TabKey, TaskItem[]> => ({
  today: [],
  upcoming: [],
  someday: [],
  ...over,
});

describe('applyDailyRollover', () => {
  it('is a no-op when the last opened date is today', () => {
    const input = tabs({
      today: [
        { label: 'a', checked: true },
        { label: 'b', checked: false },
      ],
    });

    const result = applyDailyRollover(input, '2026-07-02', '2026-07-02');

    expect(result.changed).toBe(false);
    expect(result.tasksByTab).toBe(input);
  });

  it('on a day change, drops completed Today tasks and marks the rest carriedOver', () => {
    const input = tabs({
      today: [
        { label: 'done', checked: true },
        { label: 'left undone', checked: false },
      ],
    });

    const result = applyDailyRollover(input, '2026-07-01', '2026-07-02');

    expect(result.changed).toBe(true);
    expect(result.tasksByTab.today).toEqual([
      { label: 'left undone', checked: false, carriedOver: true },
    ]);
  });

  it('leaves Upcoming and Someday untouched on a day change', () => {
    const upcoming = [{ label: 'later', checked: false }];
    const someday = [{ label: 'maybe', checked: true }];
    const input = tabs({ today: [{ label: 'x', checked: false }], upcoming, someday });

    const result = applyDailyRollover(input, '2026-07-01', '2026-07-02');

    expect(result.tasksByTab.upcoming).toBe(upcoming);
    expect(result.tasksByTab.someday).toBe(someday);
  });

  it('treats a missing last opened date (first run) as a day change', () => {
    const input = tabs();

    const result = applyDailyRollover(input, undefined, '2026-07-02');

    expect(result.changed).toBe(true);
    expect(result.tasksByTab.today).toEqual([]);
  });
});

describe('sweepCompletedFromOtherTabs', () => {
  it('drops checked Upcoming tasks', () => {
    const input = tabs({
      upcoming: [
        { label: 'done', checked: true },
        { label: 'not done', checked: false },
      ],
    });

    const result = sweepCompletedFromOtherTabs(input);

    expect(result.upcoming).toEqual([{ label: 'not done', checked: false }]);
  });

  it('drops checked Someday tasks', () => {
    const input = tabs({
      someday: [
        { label: 'done', checked: true },
        { label: 'not done', checked: false },
      ],
    });

    const result = sweepCompletedFromOtherTabs(input);

    expect(result.someday).toEqual([{ label: 'not done', checked: false }]);
  });

  it('leaves unchecked tasks in both Upcoming and Someday', () => {
    const upcoming = [{ label: 'later', checked: false }];
    const someday = [{ label: 'maybe', checked: false }];
    const input = tabs({ upcoming, someday });

    const result = sweepCompletedFromOtherTabs(input);

    expect(result.upcoming).toEqual(upcoming);
    expect(result.someday).toEqual(someday);
  });

  it('leaves Today completely untouched', () => {
    const today = [
      { label: 'done', checked: true },
      { label: 'not done', checked: false },
    ];
    const input = tabs({ today });

    const result = sweepCompletedFromOtherTabs(input);

    expect(result.today).toBe(today);
  });

  it('returns a genuinely new object rather than mutating the input', () => {
    const input = tabs({
      upcoming: [{ label: 'done', checked: true }],
      someday: [{ label: 'done', checked: true }],
    });

    const result = sweepCompletedFromOtherTabs(input);

    expect(result).not.toBe(input);
    expect(input.upcoming).toEqual([{ label: 'done', checked: true }]);
    expect(input.someday).toEqual([{ label: 'done', checked: true }]);
  });
});
