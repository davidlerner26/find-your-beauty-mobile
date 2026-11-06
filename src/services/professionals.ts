import { collection, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import { professionalConverter } from '../models/converters';
import { Professional } from '../models/professional';
import { COLLECTIONS } from '../../shared/domain';
import { db } from './firebase';

// What clients can see: professionals that haven't hidden their profile and were approved
export const isPublished = (professional: Professional) =>
  professional.published !== false && professional.approved !== false;

const catalog = () =>
  collection(db, COLLECTIONS.professionals).withConverter(professionalConverter);

// The catalog follows the database: a profile that is approved or published shows up for everyone right away.
// Returns the function that stops following.
export const followProfessionals = (
  onList: (list: Professional[]) => void,
  onError: (error: unknown) => void,
) => onSnapshot(catalog(), (snapshot) => onList(snapshot.docs.map((doc) => doc.data())), onError);

// Slots already taken from `dateKey` on, by day: { "yyyy-mm-dd": Set of "HH:mm" }
export const busyFrom = async (id: string, dateKey: string) => {
  const snapshot = await getDocs(
    query(
      collection(db, COLLECTIONS.professionals, id, COLLECTIONS.busy),
      where('date', '>=', dateKey),
    ),
  );
  const byDay = new Map<string, Set<string>>();
  for (const doc of snapshot.docs) {
    const [date, time] = doc.id.split('_');
    byDay.set(date, (byDay.get(date) ?? new Set<string>()).add(time));
  }
  return byDay;
};

// Slots ("HH:mm") already taken on a day: they live in professionals/{id}/busy, readable by anyone
export const busyTimes = async (id: string, dateKey: string) => {
  const snapshot = await getDocs(
    query(
      collection(db, COLLECTIONS.professionals, id, COLLECTIONS.busy),
      where('date', '==', dateKey),
    ),
  );
  return new Set(snapshot.docs.map((doc) => doc.id.split('_')[1]));
};
