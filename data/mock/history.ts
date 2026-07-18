import { HistoryDay, HistoryMonth } from '@/types/history';

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

const YEAR = 2026;

export const historyMonths: HistoryMonth[] = MONTH_NAMES.map(({ short, full }) => ({
  key: `${short}-${YEAR}`,
  shortLabel: short,
  fullLabel: full,
  year: YEAR,
}));

export const defaultHistoryMonthKey = `JUN-${YEAR}`;

export const historyByMonth: Record<string, HistoryDay[]> = {
  [`JUN-${YEAR}`]: [
    {
      date: 'FRIDAY, 14TH JUNE 2026',
      items: [
        { label: 'Morning meditation', checked: true },
        { label: 'Team sync (10 AM)', checked: false },
        { label: 'Draft blog post', checked: true },
      ],
    },
    {
      date: 'SATURDAY, 15TH JUNE 2026',
      items: [
        { label: 'Grocery shopping', checked: true },
        { label: 'Gym workout', checked: true },
      ],
    },
    {
      date: 'SUNDAY, 16TH JUNE 2026',
      items: [
        { label: 'Morning meditation', checked: true },
        { label: 'Team sync (10 AM)', checked: false },
        { label: 'Gym workout', checked: true },
        { label: 'Draft blog post', checked: true },
      ],
    },
  ],
};
