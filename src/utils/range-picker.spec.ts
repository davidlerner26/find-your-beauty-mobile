import {
  isBlockedDay,
  isEdgeOfRange,
  isInsideRange,
  monthCells,
  pickInRange,
} from './range-picker';

describe('pickInRange', () => {
  it('the first tap is a single day, the second closes the period', () => {
    const first = pickInRange({ start: null, end: null }, '2099-05-10');
    expect(first).toEqual({ start: '2099-05-10', end: null });
    expect(pickInRange(first, '2099-05-15')).toEqual({ start: '2099-05-10', end: '2099-05-15' });
  });

  it('an earlier day becomes the start', () => {
    expect(pickInRange({ start: '2099-05-10', end: null }, '2099-05-05')).toEqual({
      start: '2099-05-05',
      end: '2099-05-10',
    });
  });

  it('a tap after a closed period starts over', () => {
    expect(pickInRange({ start: '2099-05-10', end: '2099-05-15' }, '2099-05-20')).toEqual({
      start: '2099-05-20',
      end: null,
    });
  });
});

describe('monthCells', () => {
  it('starts on the weekday of the first day and has every day', () => {
    // May 2099 starts on a Friday
    const cells = monthCells(new Date(2099, 4, 1));
    expect(cells.slice(0, 5)).toEqual([null, null, null, null, null]);
    expect(cells[5]).toEqual({ key: '2099-05-01', day: 1, disabled: false });
    expect(cells.filter(Boolean)).toHaveLength(31);
  });

  it('disables the days before the minimum', () => {
    const cells = monthCells(new Date(2099, 4, 1), '2099-05-03').filter(Boolean);
    expect(cells.filter((c) => c!.disabled).map((c) => c!.day)).toEqual([1, 2]);
  });
});

describe('ranges', () => {
  it('knows blocked days, the inside and the edges of the selected period', () => {
    expect(isBlockedDay('2099-05-12', [{ start: '2099-05-10', end: '2099-05-15' }])).toBe(true);
    expect(isBlockedDay('2099-05-16', [{ start: '2099-05-10', end: '2099-05-15' }])).toBe(false);
    const range = { start: '2099-05-10', end: '2099-05-15' };
    expect(isInsideRange(range, '2099-05-12')).toBe(true);
    expect(isInsideRange(range, '2099-05-10')).toBe(false);
    expect(isEdgeOfRange(range, '2099-05-15')).toBe(true);
    expect(isEdgeOfRange({ start: '2099-05-10', end: null }, '2099-05-10')).toBe(true);
  });
});
