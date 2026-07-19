import React from 'react';
import { render } from '@testing-library/react-native';
import HistoryMonthSelector, { nearestIndex, MONTH_ITEM_WIDTH } from '../HistoryMonthSelector';
import { generateMonthsForYear } from '@/lib/historyDates';

const months = generateMonthsForYear(2026);

describe('nearestIndex', () => {
  it('rounds an offset to the closest chip index', () => {
    // Just past the halfway point of slot 2 rounds up to index 3.
    expect(nearestIndex(MONTH_ITEM_WIDTH * 2.6, months.length)).toBe(3);
    // Just short of halfway stays on index 2.
    expect(nearestIndex(MONTH_ITEM_WIDTH * 2.4, months.length)).toBe(2);
  });

  it('lands exactly on a slot boundary without drift', () => {
    expect(nearestIndex(MONTH_ITEM_WIDTH * 5, months.length)).toBe(5);
  });

  it('clamps a negative offset (over-scroll left) to the first index', () => {
    expect(nearestIndex(-500, months.length)).toBe(0);
  });

  it('clamps an offset past the end (over-scroll right) to the last index', () => {
    expect(nearestIndex(MONTH_ITEM_WIDTH * 999, months.length)).toBe(months.length - 1);
  });
});

describe('HistoryMonthSelector rendering', () => {
  const baseProps = {
    months,
    activeMonthKey: 'MAR-2026',
    onSelect: jest.fn(),
    containerWidth: 320,
  };

  it('renders a chip for every month', () => {
    const { getByLabelText } = render(<HistoryMonthSelector {...baseProps} />);
    for (const month of months) {
      expect(getByLabelText(month.shortLabel)).toBeTruthy();
    }
  });

  it('marks only the active month chip as selected', () => {
    const { getByLabelText } = render(<HistoryMonthSelector {...baseProps} />);

    expect(getByLabelText('MAR').props.accessibilityState.selected).toBe(true);
    expect(getByLabelText('JAN').props.accessibilityState.selected).toBe(false);
    expect(getByLabelText('DEC').props.accessibilityState.selected).toBe(false);
  });
});
