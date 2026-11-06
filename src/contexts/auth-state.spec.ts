import { authReducer, guardStateOf, initialAuthState } from './auth-state';

describe('authReducer', () => {
  it('starts not ready, signed out and with no role', () => {
    expect(initialAuthState).toMatchObject({ ready: false, user: null, role: null });
  });

  it('stores the resolved role, the admin flag and the unfinished sign up together', () => {
    const next = authReducer(initialAuthState, {
      type: 'resolved',
      role: 'professional',
      isAdmin: true,
      signupIncomplete: false,
    });
    expect(next).toMatchObject({ role: 'professional', isAdmin: true, signupIncomplete: false });
  });

  it('keeps the rest of the state when one flag changes', () => {
    const next = authReducer(
      { ...initialAuthState, role: 'client' },
      { type: 'pendingApproval', value: true },
    );
    expect(next).toMatchObject({ role: 'client', pendingApproval: true });
  });

  it('becomes ready', () => {
    expect(authReducer(initialAuthState, { type: 'ready' }).ready).toBe(true);
  });
});

describe('guardStateOf', () => {
  it('reads what the guards need', () => {
    expect(guardStateOf({ ...initialAuthState, role: 'client', isAdmin: true })).toEqual({
      signedIn: false,
      role: 'client',
      isAdmin: true,
      signupIncomplete: false,
    });
  });
});
