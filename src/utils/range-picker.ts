import { DateRange } from '../models/professional';
import { toDateKey } from './slots';

export type PendingRange = { start: string | null; end: string | null };
export type Cell = { key: string; day: number; disabled: boolean } | null;

// The first tap sets the start (one tap is already a single day), the second sets the end. A new tap after that
// starts over, and an earlier day than the start becomes the start.
export const pickInRange = ({ start, end }: PendingRange, key: string): PendingRange => {
  if (!start || end) return { start: key, end: null };
  return key < start ? { start: key, end: start } : { start, end: key };
};

// The days of a month laid out from Sunday, with blanks before the first. `min` ("yyyy-mm-dd") is the earliest
// day that can be picked.
export const monthCells = (month: Date, min = ''): Cell[] => {
  const total = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const blanks: Cell[] = Array(new Date(month.getFullYear(), month.getMonth(), 1).getDay()).fill(
    null,
  );
  return [
    ...blanks,
    ...Array.from({ length: total }, (_, i): Cell => {
      const key = toDateKey(new Date(month.getFullYear(), month.getMonth(), i + 1));
      return { key, day: i + 1, disabled: !!min && key < min };
    }),
  ];
};

export const isBlockedDay = (key: string, blocked: DateRange[]) =>
  blocked.some((range) => key >= range.start && key <= range.end);

export const isInsideRange = ({ start, end }: PendingRange, key: string) =>
  !!start && !!end && key > start && key < end;

export const isEdgeOfRange = ({ start, end }: PendingRange, key: string) =>
  start === key || (end ?? start) === key;
