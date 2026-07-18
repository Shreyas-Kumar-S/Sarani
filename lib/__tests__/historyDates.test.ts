import { formatHistoryDayLabel, generateMonthsForYear, monthKeyForDate } from '../historyDates';

describe('generateMonthsForYear', () => {
  it('produces all 12 months, year-qualified', () => {
    const months = generateMonthsForYear(2026);

    expect(months).toHaveLength(12);
    expect(months[0]).toEqual({
      key: 'JAN-2026',
      shortLabel: 'JAN',
      fullLabel: 'January',
      year: 2026,
    });
    expect(months[11]).toEqual({
      key: 'DEC-2026',
      shortLabel: 'DEC',
      fullLabel: 'December',
      year: 2026,
    });
  });
});

describe('monthKeyForDate', () => {
  it('derives the same key shape generateMonthsForYear produces', () => {
    expect(monthKeyForDate('2026-06-14')).toBe('JUN-2026');
    expect(monthKeyForDate('2026-01-01')).toBe('JAN-2026');
    expect(monthKeyForDate('2026-12-31')).toBe('DEC-2026');
  });
});

describe('formatHistoryDayLabel', () => {
  it('formats with the correct weekday and ordinal suffix', () => {
    // 2026-06-14 is a Sunday.
    expect(formatHistoryDayLabel('2026-06-14')).toBe('SUNDAY, 14TH JUNE 2026');
  });

  it('uses ST/ND/RD/TH ordinals correctly, including the 11-13 exception', () => {
    expect(formatHistoryDayLabel('2026-06-01')).toContain('1ST');
    expect(formatHistoryDayLabel('2026-06-02')).toContain('2ND');
    expect(formatHistoryDayLabel('2026-06-03')).toContain('3RD');
    expect(formatHistoryDayLabel('2026-06-11')).toContain('11TH');
    expect(formatHistoryDayLabel('2026-06-12')).toContain('12TH');
    expect(formatHistoryDayLabel('2026-06-13')).toContain('13TH');
    expect(formatHistoryDayLabel('2026-06-21')).toContain('21ST');
  });

  it('parses as a local date, not UTC, so the weekday never shifts', () => {
    // A date string with no time component must not be interpreted as
    // midnight UTC (which would render as the previous day in western
    // timezones) — this pins that down explicitly.
    expect(formatHistoryDayLabel('2026-01-01')).toBe('THURSDAY, 1ST JANUARY 2026');
  });
});
