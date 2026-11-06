import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  Timestamp,
  where,
  writeBatch,
} from 'firebase/firestore';
import { COLLECTIONS, freesSlots, ProfessionalAnswer } from '../../shared/domain';
import { Booking } from '../models/booking';
import { APP_LANGUAGE } from '../utils/locale';
import { NewBooking } from '../utils/booking-request';
import { db } from './firebase';

// Follows the bookings of the signed in user (`field` is clientUid for a client, professionalUid for a
// professional), sorted by date. Returns the function that stops following.
export const followBookings = (
  field: 'clientUid' | 'professionalUid',
  uid: string,
  onList: (list: Booking[]) => void,
  onError: (error: unknown) => void,
) =>
  onSnapshot(
    query(collection(db, COLLECTIONS.bookings), where(field, '==', uid)),
    (snapshot) => {
      const list = snapshot.docs.map((d): Booking => {
        const data = d.data();
        return {
          ...(data as Omit<Booking, 'id' | 'startsAt'>),
          id: d.id,
          startsAt: (data['startsAt'] as Timestamp).toDate(),
        };
      });
      list.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
      onList(list);
    },
    onError,
  );

const busyRef = (professionalId: string, busyId: string) =>
  doc(db, COLLECTIONS.professionals, professionalId, COLLECTIONS.busy, busyId);

// The client requests a booking. A Cloud Function notifies both sides.
export const createBooking = async (
  user: { uid: string; displayName: string | null; email: string | null },
  booking: NewBooking,
) => {
  const clientName = user.displayName || user.email || 'Cliente';
  const bookingRef = doc(collection(db, COLLECTIONS.bookings));

  const batch = writeBatch(db);
  // One document per slot: it can only be created once, so two clients can't take the same slot
  for (const busyId of booking.busyIds) {
    batch.set(busyRef(booking.professionalId, busyId), {
      date: busyId.split('_')[0],
      clientUid: user.uid,
      // The rules check the slot against this booking, created in the same batch
      bookingId: bookingRef.id,
    });
  }
  batch.set(bookingRef, {
    ...booking,
    clientUid: user.uid,
    clientName,
    status: 'pending',
    // The language of the app: the e-mails about this booking go in it
    lang: APP_LANGUAGE,
    createdAt: serverTimestamp(),
  });
  await batch.commit();
  return bookingRef.id;
};

// The professional answers a request or concludes a booking. A Cloud Function notifies the client.
export const setBookingStatus = async (booking: Booking, status: ProfessionalAnswer) => {
  if (!booking.id) return;

  const batch = writeBatch(db);
  batch.update(doc(db, COLLECTIONS.bookings, booking.id), {
    status,
    updatedAt: serverTimestamp(),
  });
  // A declined or cancelled booking frees its slots
  if (freesSlots(status)) {
    for (const busyId of booking.busyIds ?? []) {
      batch.delete(busyRef(booking.professionalId, busyId));
    }
  }
  await batch.commit();
};

// The client cancels a booking. The slots are freed and a Cloud Function notifies the professional.
export const cancelBooking = async (booking: Booking) => {
  if (!booking.id) return;

  const batch = writeBatch(db);
  batch.update(doc(db, COLLECTIONS.bookings, booking.id), {
    status: 'cancelled',
    updatedAt: serverTimestamp(),
  });
  for (const busyId of booking.busyIds ?? []) {
    batch.delete(busyRef(booking.professionalId, busyId));
  }
  await batch.commit();
};
