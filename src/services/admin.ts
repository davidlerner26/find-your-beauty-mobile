import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { COLLECTIONS } from '../../shared/domain';
import { professionalConverter } from '../models/converters';
import { pendingList } from '../utils/admin-list';
import { db } from './firebase';

// Professionals sign up with `approved: false` and can only sign in after an admin approves them. A denied one keeps
// `approved: false` and gets `rejected: true`.

// Everyone who is waiting for an answer, oldest first
export const pendingProfessionals = async () => {
  const snapshot = await getDocs(
    query(collection(db, COLLECTIONS.professionals), where('approved', '==', false)),
  );
  return pendingList(
    snapshot.docs.map((d) => ({ id: d.id, data: d.data() })),
    (value) => (value instanceof Timestamp ? value.toDate() : null),
  );
};

// The whole profile, even if it is not published
export const professionalForReview = async (id: string) => {
  const snapshot = await getDoc(
    doc(db, COLLECTIONS.professionals, id).withConverter(professionalConverter),
  );
  return snapshot.exists() ? snapshot.data() : null;
};

// The CPF of a professional (private: only the owner and admins can read it)
export const cpfOf = async (id: string) => {
  const snapshot = await getDoc(
    doc(db, COLLECTIONS.professionals, id, COLLECTIONS.private, 'identity'),
  );
  return (snapshot.data()?.['cpf'] as string | undefined) ?? '';
};

// Approving makes the profile public at once: it was complete when it was sent, so it is published (unless the
// professional chose to hide it)
export const approveProfessional = async (id: string) => {
  const snapshot = await getDoc(doc(db, COLLECTIONS.professionals, id));
  const visible = snapshot.data()?.['visible'] !== false;
  await updateDoc(doc(db, COLLECTIONS.professionals, id), {
    approved: true,
    rejected: false,
    published: visible,
  });
};

export const rejectProfessional = (id: string) =>
  updateDoc(doc(db, COLLECTIONS.professionals, id), { approved: false, rejected: true });
