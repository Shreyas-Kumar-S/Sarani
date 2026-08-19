import { scrollTargetForRow } from '../scrollToRow';

describe('scrollTargetForRow', () => {
  it('positions the row topMargin px below the scroll top by default', () => {
    expect(scrollTargetForRow(500)).toBe(476);
  });

  it('honors a custom top margin', () => {
    expect(scrollTargetForRow(100, 40)).toBe(60);
  });

  it('never returns a negative scroll offset for a row near the top', () => {
    expect(scrollTargetForRow(10)).toBe(0);
    expect(scrollTargetForRow(0)).toBe(0);
  });
});
