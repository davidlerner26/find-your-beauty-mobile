import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { COLLECTIONS } from '../../shared/domain';
import { DEFAULT_AVAILABILITY } from '../models/professional';
import { draftFields, DraftForm, draftFromData } from '../utils/drafts';
import { db, firebaseAuth, functions } from './firebase';
import { removePhoto, uploadPhoto } from './photos';

// Profiles an admin makes for professionals who have no account yet. They are not public: only admins read
// `professionalDrafts` (see firestore.rules of the site). An invite link lets the professional claim one; claiming
// copies it to `professionals/{uid}` (Cloud Function claimProfessionalDraft).

const toDate = (value: unknown) => (value instanceof Timestamp ? value.toDate() : null);

// A new id, so the photo can be uploaded before the first save
export const newDraftId = () => doc(collection(db, COLLECTIONS.professionalDrafts)).id;

export const listDrafts = async () => {
  const snapshot = await getDocs(collection(db, COLLECTIONS.professionalDrafts));
  return snapshot.docs
    .map((d) => draftFromData(d.id, d.data(), toDate))
    .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
};

export const getDraft = async (id: string) => {
  const snapshot = await getDoc(doc(db, COLLECTIONS.professionalDrafts, id));
  return snapshot.exists() ? draftFromData(id, snapshot.data(), toDate) : null;
};

// Creates the draft when it does not exist, and only changes the typed fields when it does (the invite stays)
export const saveDraft = (id: string, form: DraftForm, isNew: boolean) => {
  const ref = doc(db, COLLECTIONS.professionalDrafts, id);
  if (!isNew) return updateDoc(ref, draftFields(form));

  return setDoc(ref, {
    ...draftFields(form),
    // The rest of a professional profile, empty: the professional completes it after claiming
    address: '',
    tags: [],
    services: [],
    gallery: [],
    position: { lat: 0, lng: 0 },
    availability: DEFAULT_AVAILABILITY,
    createdBy: firebaseAuth.currentUser?.uid ?? '',
    createdAt: serverTimestamp(),
  });
};

// Makes the invite link, to send by hand. A new one replaces the old: the previous link stops working. The link is
// only shown now (the server keeps the hash of its token).
export const createInviteLink = async (id: string) => {
  const { data } = await httpsCallable<{ draftId: string }, { ok: boolean; url: string }>(
    functions,
    'createProfessionalInvite',
  )({ draftId: id });
  return data.url;
};

// The link stops working
export const revokeInvite = (id: string) =>
  updateDoc(doc(db, COLLECTIONS.professionalDrafts, id), {
    inviteHash: deleteField(),
    inviteExpiresAt: deleteField(),
    invitedAt: deleteField(),
  });

export const uploadDraftPhoto = (
  id: string,
  photo: { uri: string; width: number; height: number },
) => uploadPhoto(id, 'profile', photo, 'professionalDrafts');

export const removeDraftPhoto = removePhoto;

export const deleteDraft = async (id: string, image: string) => {
  await deleteDoc(doc(db, COLLECTIONS.professionalDrafts, id));
  if (image) await removePhoto(image);
};
