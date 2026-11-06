import { BookingStatus } from '../../shared/domain';
import { hasConflict } from './booking-conflict';

const booking = (status: BookingStatus, hour: number, durationMinutes = 60) => ({
  status,
  startsAt: new Date(2099, 4, 5, hour, 0),
  durationMinutes,
});
const day = new Date(2099, 4, 5);

describe('hasConflict', () => {
  it('is true when an open booking overlaps the time', () => {
    expect(hasConflict([booking('pending', 10)], day, '10:00', 60)).toBe(true);
    expect(hasConflict([booking('confirmed', 10, 120)], day, '11:00', 60)).toBe(true);
    expect(hasConflict([booking('confirmed', 10)], day, '09:30', 60)).toBe(true);
  });

  it('is false for a booking that ends when the other starts', () => {
    expect(hasConflict([booking('confirmed', 10)], day, '11:00', 60)).toBe(false);
    expect(hasConflict([booking('confirmed', 10)], day, '09:00', 60)).toBe(false);
  });

  it('ignores closed bookings and other days', () => {
    expect(hasConflict([booking('cancelled', 10), booking('declined', 10)], day, '10:00', 60)).toBe(
      false,
    );
    expect(hasConflict([booking('pending', 10)], new Date(2099, 4, 6), '10:00', 60)).toBe(false);
  });
});
