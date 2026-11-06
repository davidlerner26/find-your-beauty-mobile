import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
} from 'firebase/firestore';
import { Review } from '../models/professional';
import { COLLECTIONS } from '../../shared/domain';
import { db } from './firebase';

export const listReviews = async (professionalId: string) => {
  const snapshot = await getDocs(
    query(
      collection(db, COLLECTIONS.professionals, professionalId, COLLECTIONS.reviews),
      orderBy('createdAt', 'desc'),
    ),
  );
  return snapshot.docs.map((d): Review => {
    const data = d.data();
    return {
      id: d.id,
      author: data['author'],
      stars: data['stars'],
      text: data['text'],
      createdAt: (data['createdAt'] as Timestamp | null)?.toDate() ?? null,
    };
  });
};

// A completed booking of this client with this professional (the rules require it to review). Null when none.
export const completedBookingId = async (uid: string, professionalId: string) => {
  const snapshot = await getDocs(
    query(
      collection(db, COLLECTIONS.bookings),
      where('clientUid', '==', uid),
      where('professionalId', '==', professionalId),
    ),
  );
  return snapshot.docs.find((d) => d.data()['status'] === 'completed')?.id ?? null;
};

// Creates or replaces the client's review. A Cloud Function updates the professional's rating.
export const saveReview = (
  user: { uid: string; displayName: string | null },
  professionalId: string,
  bookingId: string,
  stars: number,
  text: string,
) =>
  setDoc(doc(db, COLLECTIONS.professionals, professionalId, COLLECTIONS.reviews, user.uid), {
    clientUid: user.uid,
    author: user.displayName || 'Cliente',
    bookingId,
    stars,
    text: text.trim(),
    createdAt: serverTimestamp(),
  });

// The client removes their own review. A Cloud Function updates the professional's rating.
export const removeReview = (uid: string, professionalId: string) =>
  deleteDoc(doc(db, COLLECTIONS.professionals, professionalId, COLLECTIONS.reviews, uid));
