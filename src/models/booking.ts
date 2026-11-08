import { BookingStatus, Lang, PaymentStatus } from '../../shared/domain';

export type { BookingStatus };

// bookings/{id}
export type Booking = {
  id?: string;
  clientUid: string;
  clientName: string;
  professionalId: string;
  // null for demo professionals that don't have an account
  professionalUid: string | null;
  professionalName: string;
  services: { id: string; name: string; price: number; durationMinutes: number }[];
  startsAt: Date;
  durationMinutes: number;
  total: number;
  notes: string;
  // Ids of the documents in professionals/{id}/busy that hold this booking's time slots
  busyIds: string[];
  status: BookingStatus;
  // Where the service happens: at the client's home or at the professional's address (older bookings have no value)
  place?: 'home' | 'studio';
  // The address of the client, for a service at home
  clientAddress?: string;
  // Language of the page where the booking was made (the e-mails go in it)
  lang?: Lang;
  // The app has no payment: bookings are created with the payment pending
  paymentStatus: PaymentStatus;
  // Where the booking was made. The app says 'mobile' and the Functions do not ask it for a payment hold (the test
  // environment of the site asks the bookings of the site; the older ones have no value and count as the site's)
  source?: 'web' | 'mobile';
};
