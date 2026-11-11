import { asLang, Lang } from '../../shared/domain';
import { t } from '../i18n';
import { aboutToParagraphs, paragraphsToAbout } from './profile-form';
import { authErrorMessage, isValidEmail } from './validators';

// What the admin types to make a profile for a professional who has no account yet
export type DraftForm = {
  name: string;
  email: string;
  phone: string;
  lang: Lang;
  instagram: string;
  about: string;
  image: string;
};

export const EMPTY_DRAFT_FORM: DraftForm = {
  name: '',
  email: '',
  phone: '',
  lang: 'pt',
  instagram: '',
  about: '',
  image: '',
};

export type InviteStatus = 'none' | 'sent' | 'expired';

export type ProfessionalDraft = {
  id: string;
  form: DraftForm;
  invited: boolean;
  invitedAt: Date | null;
  // Milliseconds; null when the invite was never sent
  inviteExpiresAt: number | null;
  createdAt: Date | null;
};

// The invite of a draft: not sent yet, waiting for the professional, or past its date
export const inviteStatus = (
  draft: Pick<ProfessionalDraft, 'invited' | 'inviteExpiresAt'>,
  now = Date.now(),
): InviteStatus => {
  if (!draft.invited) return 'none';
  return draft.inviteExpiresAt !== null && now > draft.inviteExpiresAt ? 'expired' : 'sent';
};

export type DraftErrors = Partial<Record<'name' | 'email', string>>;

// What is wrong before the draft can be saved
export const validateDraft = (form: DraftForm): DraftErrors => ({
  ...(form.name.trim().length >= 3 ? {} : { name: t('Digite o nome (pelo menos 3 letras).') }),
  ...(isValidEmail(form.email.trim()) ? {} : { email: t('Digite um e-mail válido.') }),
});

// "@ana.makeup" and "https://instagram.com/ana.makeup/" both become "ana.makeup"
export const instagramUsername = (value: string) =>
  value
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
    .replace(/^@/, '')
    .replace(/[/?#].*$/, '');

// The fields saved in the draft (the same names as the professional document, plus the e-mail of the invite)
export const draftFields = (form: DraftForm) => ({
  name: form.name.trim(),
  claimEmail: form.email.trim().toLowerCase(),
  phone: form.phone.trim(),
  lang: form.lang,
  instagram: instagramUsername(form.instagram),
  about: aboutToParagraphs(form.about),
  image: form.image,
});

// The draft as the screens use it, from the Firestore document
export const draftFromData = (
  id: string,
  data: Record<string, unknown>,
  toDate: (value: unknown) => Date | null,
): ProfessionalDraft => {
  const about = Array.isArray(data['about']) ? (data['about'] as string[]) : [];
  const expires = data['inviteExpiresAt'];
  return {
    id,
    form: {
      name: String(data['name'] ?? ''),
      email: String(data['claimEmail'] ?? ''),
      phone: String(data['phone'] ?? ''),
      lang: asLang(data['lang']),
      instagram: String(data['instagram'] ?? ''),
      about: paragraphsToAbout(about),
      image: String(data['image'] ?? ''),
    },
    invited: typeof data['inviteHash'] === 'string',
    invitedAt: toDate(data['invitedAt']),
    inviteExpiresAt: typeof expires === 'number' ? expires : null,
    createdAt: toDate(data['createdAt']),
  };
};

// The message of an error of the invite: a Cloud Function answers in the language of the app, a Firebase Auth error
// has a code
export const inviteErrorMessage = (error: unknown) => {
  const { code, message } = (error ?? {}) as { code?: string; message?: string };
  return code?.startsWith('functions/') && message ? message : authErrorMessage(error);
};
