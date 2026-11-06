import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  confirmPasswordReset,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User,
  verifyPasswordResetCode,
} from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react';
import { firebaseAuth, functions } from '../services/firebase';
import { professionalAccounts } from '../services/professional-accounts';
import { users } from '../services/users';
import { APP_LANGUAGE } from '../utils/locale';
import { log } from '../utils/log';
import { Role, roleFor } from '../utils/role';
import { authReducer, AuthState, initialAuthState } from './auth-state';

export type SignUpData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  cpf: string;
  address?: string;
  addressPosition?: { lat: number; lng: number };
  password: string;
};

// Clients that sign up with e-mail and password confirm the e-mail with a code. Accounts from before this
// existed are not asked to.
const VERIFICATION_FROM = new Date('2026-10-23T00:00:00-03:00').getTime();
const VERIFICATION_KEY = 'email-verification';

const call = <Request, Response>(name: string) => httpsCallable<Request, Response>(functions, name);

// The actions of the account. They are separate from the state so that a screen that only signs in does not
// render again when the state changes.
export type AuthActions = {
  signUpWithEmail: (data: SignUpData) => Promise<void>;
  signUpProfessional: (data: SignUpData) => Promise<void>;
  signInClient: (email: string, password: string) => Promise<void>;
  signInProfessional: (email: string, password: string) => Promise<void>;
  startVerification: (email: string, password: string | null) => Promise<void>;
  sendVerificationCode: (email: string) => Promise<void>;
  // true when the user is signed in after the code, false when the login has to be done again
  verifyEmail: (code: string) => Promise<boolean>;
  sendPasswordReset: (email: string) => Promise<void>;
  verifyResetCode: (code: string) => Promise<string>;
  confirmPasswordReset: (code: string, password: string) => Promise<void>;
  updateName: (name: string) => Promise<void>;
  finishSignup: () => Promise<void>;
  clearSignupSubmitted: () => void;
  signOut: () => Promise<void>;
};

const StateContext = createContext<AuthState | null>(null);
const ActionsContext = createContext<AuthActions | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);
  // What the actions read right after they changed it: the state of the reducer only shows up after the next
  // render, but a sign in has to check the role it just resolved (the site's signals update at once). Written
  // by the callbacks below, never during a render.
  const latest = useRef<{
    role: Role | null;
    signupIncomplete: boolean;
    verification: AuthState['verification'];
  }>({ role: null, signupIncomplete: false, verification: null });
  const roleRequest = useRef(0);

  // Returns true when the account is a professional still waiting for approval
  const resolveRole = useCallback(async (user: User | null) => {
    const request = ++roleRequest.current;
    let result = { role: null as Role | null, pending: false, incomplete: false };
    let admin = false;

    if (user) {
      result = { role: 'client', pending: false, incomplete: false };
      try {
        const [profile, account] = await Promise.all([
          professionalAccounts.status(user.uid),
          users.get(user.uid),
        ]);
        admin = account?.admin === true;
        result = roleFor(profile);
        if (result.pending) dispatch({ type: 'pendingApproval', value: true });
      } catch (error) {
        log.error('Failed to resolve role', error);
      }
    }

    // Ignore answers that were overtaken by a newer request
    if (request === roleRequest.current) {
      latest.current.role = result.role;
      latest.current.signupIncomplete = result.incomplete;
      dispatch({
        type: 'resolved',
        role: result.role,
        isAdmin: admin,
        signupIncomplete: result.incomplete,
      });
    }
    return result.pending;
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(VERIFICATION_KEY)
      .then((email) => {
        if (email && !latest.current.verification) {
          latest.current.verification = { email, password: null };
          dispatch({ type: 'verification', value: latest.current.verification });
        }
      })
      .catch((error) => log.warn('Failed to read the pending verification', error));

    return onAuthStateChanged(firebaseAuth, async (user) => {
      dispatch({ type: 'user', user });
      const pending = await resolveRole(user);
      // A professional waiting for approval can't stay signed in
      if (pending) await signOut(firebaseAuth);
      dispatch({ type: 'ready' });
    });
  }, [resolveRole]);

  const actions = useMemo<AuthActions>(() => {
    const sendVerificationCode = async (email: string) => {
      await call<{ email: string; lang: string }, { ok: boolean }>('sendVerificationCode')({
        email,
        lang: APP_LANGUAGE,
      });
    };

    // Remembers the e-mail and sends a first code
    const startVerification = async (email: string, password: string | null) => {
      latest.current.verification = { email, password };
      dispatch({ type: 'verification', value: latest.current.verification });
      await AsyncStorage.setItem(VERIFICATION_KEY, email).catch((error) =>
        log.warn('Failed to remember the e-mail to verify', error),
      );
      await sendVerificationCode(email).catch((error) =>
        log.error('Failed to send the code', error),
      );
    };

    // Each login screen only takes the accounts of its own area
    const requireArea = async (area: 'client' | 'professional') => {
      const { role, signupIncomplete } = latest.current;
      const wrong =
        area === 'professional' ? role !== 'professional' && !signupIncomplete : role !== 'client';
      if (!wrong) return;
      await signOut(firebaseAuth);
      throw { code: area === 'professional' ? 'auth/not-professional' : 'auth/not-client' };
    };

    const signInWithEmail = async (email: string, password: string) => {
      dispatch({ type: 'pendingApproval', value: false });
      const { user } = await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
      if (await resolveRole(user)) {
        await signOut(firebaseAuth);
        throw { code: 'auth/pending-approval' };
      }
    };

    return {
      async signUpWithEmail({
        firstName,
        lastName,
        email,
        phone,
        cpf,
        address,
        addressPosition,
        password,
      }) {
        const { user } = await createUserWithEmailAndPassword(firebaseAuth, email.trim(), password);
        await updateProfile(user, { displayName: `${firstName.trim()} ${lastName.trim()}` });
        dispatch({ type: 'user', user });
        await resolveRole(user);

        // The account already exists at this point, so a failure here must not fail the sign up
        try {
          await users.create(user.uid, {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim(),
            phone,
            cpf,
            address: address ?? '',
            addressPosition: addressPosition ?? { lat: 0, lng: 0 },
          });
        } catch (error) {
          log.error('Failed to save user', error);
        }

        // Not signed in until the e-mail is confirmed with the code
        await signOut(firebaseAuth);
        await startVerification(email.trim(), password);
      },

      // Professionals are separate accounts: the profile document id is the account uid
      async signUpProfessional({ firstName, lastName, email, phone, cpf, password }) {
        dispatch({ type: 'signupSubmitted', value: false });
        const { user } = await createUserWithEmailAndPassword(firebaseAuth, email.trim(), password);
        const name = `${firstName.trim()} ${lastName.trim()}`;
        await updateProfile(user, { displayName: name });
        dispatch({ type: 'user', user });

        await professionalAccounts.create({ uid: user.uid, name, email: email.trim(), phone });
        // The CPF is private: it is not in the public profile
        await professionalAccounts
          .saveCpf(user.uid, cpf)
          .catch((error) => log.error('Failed to save the CPF', error));
        // Stays signed in: the second step of the sign up completes the profile
        await resolveRole(user);
      },

      async signInClient(email, password) {
        await signInWithEmail(email, password);

        // A new account that never confirmed the e-mail goes to the code screen
        const user = firebaseAuth.currentUser;
        const createdAt = Date.parse(user?.metadata.creationTime ?? '');
        if (
          user &&
          !user.emailVerified &&
          createdAt >= VERIFICATION_FROM &&
          user.providerData.some((p) => p.providerId === 'password')
        ) {
          await signOut(firebaseAuth);
          await startVerification(email.trim(), password);
          throw { code: 'auth/email-not-verified' };
        }

        await requireArea('client');
      },

      async signInProfessional(email, password) {
        await signInWithEmail(email, password);
        await requireArea('professional');
      },

      startVerification,
      sendVerificationCode,

      // Checks the code, then signs in with the password the sign up used (or asks for the login when it was lost)
      async verifyEmail(code) {
        const pending = latest.current.verification;
        if (!pending) return false;

        await call<{ email: string; code: string; lang: string }, { ok: boolean }>(
          'verifyEmailCode',
        )({ email: pending.email, code, lang: APP_LANGUAGE });
        latest.current.verification = null;
        dispatch({ type: 'verification', value: null });
        await AsyncStorage.removeItem(VERIFICATION_KEY).catch((error) =>
          log.warn('Failed to forget the e-mail to verify', error),
        );
        if (!pending.password) return false;

        await signInWithEmail(pending.email, pending.password);
        return true;
      },

      // The e-mail with the link is sent by a Cloud Function (through Resend)
      async sendPasswordReset(email) {
        await httpsCallable(
          functions,
          'sendPasswordReset',
        )({ email: email.trim(), lang: APP_LANGUAGE });
      },

      // Checks the code from the e-mail link. Returns the e-mail of the account.
      verifyResetCode: (code) => verifyPasswordResetCode(firebaseAuth, code),

      async confirmPasswordReset(code, password) {
        await confirmPasswordReset(firebaseAuth, code, password);
      },

      // Changes the name shown in the app (messages, bookings, reviews)
      async updateName(name) {
        const user = firebaseAuth.currentUser;
        if (!user) return;
        await updateProfile(user, { displayName: name });
        dispatch({ type: 'user', user });
      },

      // The profile is complete and was sent: now it waits for an admin, so the session is closed
      async finishSignup() {
        dispatch({ type: 'pendingApproval', value: true });
        // Before closing the session, so the screen goes straight to the "under review" message
        dispatch({ type: 'signupSubmitted', value: true });
        latest.current.signupIncomplete = false;
        dispatch({ type: 'signupIncomplete', value: false });
        await signOut(firebaseAuth);
      },

      // The "sent" message was seen: the next visit to the sign up shows the form again
      clearSignupSubmitted: () => dispatch({ type: 'signupSubmitted', value: false }),

      signOut: () => signOut(firebaseAuth),
    };
  }, [resolveRole]);

  return (
    <ActionsContext.Provider value={actions}>
      <StateContext.Provider value={state}>{children}</StateContext.Provider>
    </ActionsContext.Provider>
  );
}

export { guardStateOf } from './auth-state';
export type { AuthState } from './auth-state';

export function useAuth() {
  const state = useContext(StateContext);
  if (!state) throw new Error('useAuth must be used inside AuthProvider');
  return state;
}

export function useAuthActions() {
  const actions = useContext(ActionsContext);
  if (!actions) throw new Error('useAuthActions must be used inside AuthProvider');
  return actions;
}
