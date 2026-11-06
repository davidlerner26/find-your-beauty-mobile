import { guardRedirect, GuardState } from './guards';
import { PATHS } from './paths';

const state = (overrides: Partial<GuardState> = {}): GuardState => ({
  signedIn: false,
  role: null,
  isAdmin: false,
  signupIncomplete: false,
  ...overrides,
});
const client = state({ signedIn: true, role: 'client' });
const professional = state({ signedIn: true, role: 'professional' });

describe('guardRedirect', () => {
  it('client: visitors go to the login and professionals to the start', () => {
    expect(guardRedirect('client', state())).toBe(PATHS.login);
    expect(guardRedirect('client', professional)).toBe(PATHS.home);
    expect(guardRedirect('client', client)).toBeNull();
  });

  it('clientArea: professionals go to the same screen of their area, visitors stay', () => {
    expect(guardRedirect('clientArea', professional)).toBe(PATHS.proHome);
    expect(guardRedirect('clientArea', professional, { proPath: PATHS.proMessages })).toBe(
      PATHS.proMessages,
    );
    expect(guardRedirect('clientArea', state())).toBeNull();
    expect(guardRedirect('clientArea', client)).toBeNull();
  });

  it('clientEntry: a signed-in professional has no use for the client login', () => {
    expect(guardRedirect('clientEntry', professional)).toBe(PATHS.proHome);
    expect(guardRedirect('clientEntry', state())).toBeNull();
  });

  it('pro: only professionals, an unfinished sign up goes back to its second step', () => {
    expect(guardRedirect('pro', professional)).toBeNull();
    expect(guardRedirect('pro', state({ signedIn: true, signupIncomplete: true }))).toBe(
      PATHS.proSignup,
    );
    expect(guardRedirect('pro', client)).toBe(PATHS.home);
    expect(guardRedirect('pro', state())).toBe(PATHS.proLogin);
  });

  it('proEntry: for visitors and sign ups still going', () => {
    expect(guardRedirect('proEntry', client)).toBe(PATHS.home);
    expect(guardRedirect('proEntry', professional)).toBe(PATHS.proHome);
    expect(guardRedirect('proEntry', state({ signedIn: true, signupIncomplete: true }))).toBeNull();
    expect(guardRedirect('proEntry', state())).toBeNull();
  });

  it('proInstagram: professionals and unfinished sign ups', () => {
    expect(guardRedirect('proInstagram', professional)).toBeNull();
    expect(
      guardRedirect('proInstagram', state({ signedIn: true, signupIncomplete: true })),
    ).toBeNull();
    expect(guardRedirect('proInstagram', client)).toBe(PATHS.home);
    expect(guardRedirect('proInstagram', state())).toBe(PATHS.proLogin);
  });

  it('admin: only admins', () => {
    expect(guardRedirect('admin', state({ signedIn: true, isAdmin: true }))).toBeNull();
    expect(guardRedirect('admin', client)).toBe(PATHS.home);
  });
});
