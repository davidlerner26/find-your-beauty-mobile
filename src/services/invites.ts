import { httpsCallable } from 'firebase/functions';
import { APP_LANGUAGE } from '../utils/locale';
import { functions } from './firebase';

export type InviteInfo = { name: string; image: string; email: string };

// What the invite screen shows before the professional signs in. It answers only for a valid token (the one that was
// sent to the invited e-mail); anything else is an error with a message ready to show.
export const inviteInfo = async (draftId: string, token: string) => {
  const { data } = await httpsCallable<
    { draftId: string; token: string; lang: string },
    InviteInfo
  >(
    functions,
    'professionalInviteInfo',
  )({ draftId, token, lang: APP_LANGUAGE });
  return data;
};

// The Cloud Function copies the draft to professionals/{uid} for the signed in account
export const claimDraft = async (draftId: string, token: string) => {
  await httpsCallable<{ draftId: string; token: string; lang: string }, { ok: boolean }>(
    functions,
    'claimProfessionalDraft',
  )({ draftId, token, lang: APP_LANGUAGE });
};
