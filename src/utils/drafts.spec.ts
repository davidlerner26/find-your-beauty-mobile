import {
  draftFields,
  draftFromData,
  DraftForm,
  inviteErrorMessage,
  instagramUsername,
  inviteStatus,
  validateDraft,
} from './drafts';

const form: DraftForm = {
  name: ' Ana Souza ',
  email: ' Ana@Example.com ',
  phone: '',
  lang: 'pt',
  instagram: '@ana.makeup',
  about: 'Primeiro.\n\nSegundo.',
  image: '',
};

const date = (value: unknown) => (value instanceof Date ? value : null);

describe('inviteStatus', () => {
  it('is none before the invite is sent', () => {
    expect(inviteStatus({ invited: false, inviteExpiresAt: null })).toBe('none');
  });

  it('is sent until the date, then expired', () => {
    expect(inviteStatus({ invited: true, inviteExpiresAt: 1000 }, 999)).toBe('sent');
    expect(inviteStatus({ invited: true, inviteExpiresAt: 1000 }, 1001)).toBe('expired');
  });
});

describe('validateDraft', () => {
  it('asks for a name and a valid e-mail', () => {
    expect(validateDraft(form)).toEqual({});
    expect(Object.keys(validateDraft({ ...form, name: 'An' }))).toEqual(['name']);
    expect(Object.keys(validateDraft({ ...form, email: 'ana@' }))).toEqual(['email']);
  });
});

describe('instagramUsername', () => {
  it('takes the username out of a handle or a link', () => {
    expect(instagramUsername('@ana.makeup')).toBe('ana.makeup');
    expect(instagramUsername('https://www.instagram.com/ana.makeup/?hl=pt')).toBe('ana.makeup');
    expect(instagramUsername(' ana.makeup ')).toBe('ana.makeup');
    expect(instagramUsername('')).toBe('');
  });
});

describe('draftFields', () => {
  it('cleans what was typed', () => {
    expect(draftFields(form)).toEqual({
      name: 'Ana Souza',
      claimEmail: 'ana@example.com',
      phone: '',
      lang: 'pt',
      instagram: 'ana.makeup',
      about: ['Primeiro.', 'Segundo.'],
      image: '',
    });
  });
});

describe('draftFromData', () => {
  it('reads a draft and its invite', () => {
    const draft = draftFromData(
      'd1',
      {
        name: 'Ana',
        claimEmail: 'ana@example.com',
        lang: 'es',
        about: ['Um', 'Dois'],
        inviteHash: 'hash',
        inviteExpiresAt: 1000,
        invitedAt: new Date(2099, 0, 1),
      },
      date,
    );
    expect(draft).toMatchObject({
      id: 'd1',
      invited: true,
      inviteExpiresAt: 1000,
      form: { name: 'Ana', email: 'ana@example.com', lang: 'es', about: 'Um\n\nDois' },
    });
    expect(draft.invitedAt).toEqual(new Date(2099, 0, 1));
  });

  it('fills what is missing', () => {
    const draft = draftFromData('d2', {}, date);
    expect(draft.invited).toBe(false);
    expect(draft.inviteExpiresAt).toBeNull();
    expect(draft.form).toMatchObject({ name: '', lang: 'pt', about: '' });
  });
});

describe('inviteErrorMessage', () => {
  it('shows what the Cloud Function said, and the usual message for anything else', () => {
    expect(
      inviteErrorMessage({ code: 'functions/failed-precondition', message: 'Convite vencido' }),
    ).toBe('Convite vencido');
    expect(inviteErrorMessage({ code: 'auth/invalid-credential' })).toBe(
      'E-mail ou senha incorretos.',
    );
    expect(inviteErrorMessage(null)).toBe('Algo deu errado. Tente novamente.');
  });
});
