import { isClosed, isOpen } from '../../shared/domain';
import { Booking } from '../models/booking';

// Still going to happen (waiting for an answer or confirmed, soonest first) and over (the latest first)
export const upcomingAndHistory = (bookings: Booking[]) => ({
  upcoming: bookings.filter((booking) => isOpen(booking.status)),
  history: bookings.filter((booking) => isClosed(booking.status)).reverse(),
});

// The agenda of a professional: requests waiting for an answer, confirmed ones, and what is over (the latest first)
export const proAgendaLists = (bookings: Booking[]) => ({
  pending: bookings.filter((booking) => booking.status === 'pending'),
  upcoming: bookings.filter((booking) => booking.status === 'confirmed'),
  history: bookings.filter((booking) => isClosed(booking.status)).reverse(),
});
