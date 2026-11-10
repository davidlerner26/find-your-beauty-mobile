import { joinTime, minuteOptions, splitTime } from './time-wheel';

describe('time wheel', () => {
  it('splits and joins a time', () => {
    expect(splitTime('09:30')).toEqual({ hour: 9, minute: 30 });
    expect(joinTime(9, 5)).toBe('09:05');
  });

  it('falls back to 08:00 when there is no valid time', () => {
    expect(splitTime('')).toEqual({ hour: 8, minute: 0 });
    expect(splitTime('8')).toEqual({ hour: 8, minute: 0 });
  });

  it('offers a minute every 5, plus a saved one that does not fit', () => {
    expect(minuteOptions(30)).toHaveLength(12);
    const odd = minuteOptions(42);
    expect(odd).toContain(42);
    expect(odd).toEqual([...odd].sort((a, b) => a - b));
  });
});
