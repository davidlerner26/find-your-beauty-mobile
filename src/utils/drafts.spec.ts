import {
  draftFields,
  draftMissing,
  draftFromData,
  draftToForm,
  emptyDraftForm,
  inviteErrorMessage,
  instagramUsername,
  inviteStatus,
  validateDraft,
} from './drafts';

const form = {
  ...emptyDraftForm(),
  name: ' Ana Souza ',
  email: ' Ana@Example.com ',
  instagram: '@ana.makeup',
  about: 'Primeiro.\n\nSegundo.',
};

const date = (value: unknown) => (value instanceof Date ? value : null);

describe('inviteStatus', () => {
  it('is none before the link is made', () => {
    expect(inviteStatus({ invited: false, inviteExpiresAt: null })).toBe('none');
  });

  it('is sent until the date, then expired', () => {
    expect(inviteStatus({ invited: true, inviteExpiresAt: 1000 }, 999)).toBe('sent');
    expect(inviteStatus({ invited: true, inviteExpiresAt: 1000 }, 1001)).toBe('expired');
  });
});

describe('validateDraft', () => {
  it('asks for a name, and for a valid e-mail only when there is one', () => {
    expect(validateDraft(form)).toEqual({});
    expect(validateDraft({ ...form, email: '' })).toEqual({});
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
    expect(draftFields(form)).toMatchObject({
      name: 'Ana Souza',
      claimEmail: 'ana@example.com',
      cpf: '',
      instagram: 'ana.makeup',
      about: ['Primeiro.', 'Segundo.'],
      services: [],
      tags: [],
      complete: false,
    });
  });

  it('keeps only a valid CPF, and no address for a home-only professional', () => {
    expect(draftFields({ ...form, cpf: '529.982.247-25' }).cpf).toBe('529.982.247-25');
    expect(draftFields({ ...form, cpf: '111.111.111-11' }).cpf).toBe('');
    const home = draftFields({
      ...form,
      serviceMode: 'home',
      address: 'Rua A, 1',
      position: { lat: 1, lng: 2 },
    });
    expect(home).toMatchObject({ address: '', position: { lat: 0, lng: 0 } });
  });
});

describe('validateDraft of the other fields', () => {
  it('rejects an invalid CPF', () => {
    expect(Object.keys(validateDraft({ ...form, cpf: '123' }))).toEqual(['cpf']);
  });
});

describe('draftToForm', () => {
  it('reads what draftFields wrote', () => {
    const saved = draftFields({
      ...form,
      cpf: '529.982.247-25',
      serviceMode: 'studio',
      address: 'Rua A, 1',
      position: { lat: 1, lng: 2 },
      gallery: ['g1'],
    });
    expect(draftToForm(saved)).toMatchObject({
      name: 'Ana Souza',
      email: 'ana@example.com',
      cpf: '529.982.247-25',
      serviceMode: 'studio',
      address: 'Rua A, 1',
      addressConfirmed: true,
      gallery: ['g1'],
      about: 'Primeiro.\n\nSegundo.',
    });
  });

  it('starts empty for a document without the new fields', () => {
    expect(draftToForm({ name: 'Ana' })).toMatchObject({
      name: 'Ana',
      serviceMode: null,
      addressConfirmed: false,
      services: [],
    });
    expect(draftMissing(draftToForm({ name: 'Ana' }))).toContain('CPF');
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
