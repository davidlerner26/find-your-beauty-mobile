import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { COLLECTIONS } from '../../shared/domain';
import { db } from './firebase';

// users/{uid}/favorites/{professionalId}: the professionals a client hearted
export const followFavorites = (
  uid: string,
  onIds: (ids: string[]) => void,
  onError: (error: unknown) => void,
) =>
  onSnapshot(
    collection(db, COLLECTIONS.users, uid, COLLECTIONS.favorites),
    (snapshot) => onIds(snapshot.docs.map((d) => d.id)),
    onError,
  );

const favoriteRef = (uid: string, professionalId: string) =>
  doc(db, COLLECTIONS.users, uid, COLLECTIONS.favorites, professionalId);

export const addFavorite = (uid: string, professionalId: string) =>
  setDoc(favoriteRef(uid, professionalId), { createdAt: serverTimestamp() });

export const removeFavorite = (uid: string, professionalId: string) =>
  deleteDoc(favoriteRef(uid, professionalId));
