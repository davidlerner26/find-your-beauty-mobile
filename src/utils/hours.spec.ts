import { DEFAULT_AVAILABILITY } from '../models/professional';
import { workingHours } from './hours';

describe('workingHours', () => {
  it('joins days in a row that have the same hours', () => {
    expect(workingHours(DEFAULT_AVAILABILITY)).toEqual([
      { days: 'Segunda a sexta', hours: '08:00 - 18:00' },
      { days: 'Sábado', hours: '09:00 - 14:00' },
    ]);
  });

  it('skips the days that are off', () => {
    const weekly = Object.fromEntries(
      Object.entries(DEFAULT_AVAILABILITY.weekly).map(([day, config]) => [
        day,
        { ...config, enabled: day === '3' },
      ]),
    );
    expect(workingHours({ ...DEFAULT_AVAILABILITY, weekly })).toEqual([
      { days: 'Quarta', hours: '08:00 - 18:00' },
    ]);
  });

  it('is empty when nothing is enabled', () => {
    expect(workingHours({ ...DEFAULT_AVAILABILITY, weekly: {} })).toEqual([]);
  });
});
