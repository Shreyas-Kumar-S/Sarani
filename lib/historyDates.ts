import { HistoryMonth } from '@/types/history';

const MONTH_NAMES: { short: string; full: string }[] = [
  { short: 'JAN', full: 'January' },
  { short: 'FEB', full: 'February' },
  { short: 'MAR', full: 'March' },
  { short: 'APR', full: 'April' },
  { short: 'MAY', full: 'May' },
  { short: 'JUN', full: 'June' },
  { short: 'JUL', full: 'July' },
  { short: 'AUG', full: 'August' },
  { short: 'SEP', full: 'September' },
  { short: 'OCT', full: 'October' },
  { short: 'NOV', full: 'November' },
  { short: 'DEC', full: 'December' },
];

const WEEKDAYS_UPPER = [
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
];

// The 12 chips for the month scroller, year-qualified so a future year's
// January doesn't collide with this year's key.
export function generateMonthsForYear(year: number): HistoryMonth[] {
  return MONTH_NAMES.map(({ short, full }) => ({
    key: `${short}-${year}`,
    shortLabel: short,
    fullLabel: full,
    year,
  }));
}

// Same key shape as generateMonthsForYear, derived from a local YYYY-MM-DD
// date string — lets a history entry's date be mapped straight to its chip.
export function monthKeyForDate(dateString: string): string {
  const [year, month] = dateString.split('-');
  return `${MONTH_NAMES[Number(month) - 1].short}-${year}`;
}

function ordinal(day: number): string {
  if (day >= 11 && day <= 13) {
    return `${day}TH`;
  }
  switch (day % 10) {
    case 1:
      return `${day}ST`;
    case 2:
      return `${day}ND`;
    case 3:
      return `${day}RD`;
    default:
      return `${day}TH`;
  }
}

// 'FRIDAY, 14TH JUNE 2026' — parsed as a local date (not UTC) to match
// taskStorage's todayString, so a day boundary never shifts by a timezone.
export function formatHistoryDayLabel(dateString: string): string {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const weekday = WEEKDAYS_UPPER[date.getDay()];
  const monthName = MONTH_NAMES[month - 1].full.toUpperCase();
  return `${weekday}, ${ordinal(day)} ${monthName} ${year}`;
}
