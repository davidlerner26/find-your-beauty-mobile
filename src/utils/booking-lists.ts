import { isClosed, isOpen } from '../../shared/domain';
import { Booking } from '../models/booking';

// Still going to happen (waiting for an answer or confirmed, soonest first) and over (the latest first)
export const upcomingAndHistory = (bookings: Booking[]) => ({
  upcoming: bookings.filter((booking) => isOpen(booking.status)),
  history: bookings.filter((booking) => isClosed(booking.status)).reverse(),
});
