import { isOpen } from '../../shared/domain';
import { Booking } from '../models/booking';

// A client can't have two bookings at the same time, even with different professionals: the times that overlap a
// booking that is waiting or confirmed are not offered
export const hasConflict = (
  bookings: Pick<Booking, 'status' | 'startsAt' | 'durationMinutes'>[],
  day: Date,
  time: string,
  durationMinutes: number,
) => {
  const [hour, minute] = time.split(':').map(Number);
  const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, minute).getTime();
  const end = start + durationMinutes * 60000;
  return bookings.some(
    (booking) =>
      isOpen(booking.status) &&
      booking.startsAt.getTime() < end &&
      booking.startsAt.getTime() + booking.durationMinutes * 60000 > start,
  );
};
