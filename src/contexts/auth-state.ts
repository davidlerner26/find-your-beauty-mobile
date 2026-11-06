import type { User } from 'firebase/auth';
import { GuardState } from '../utils/guards';
import { Role } from '../utils/role';

export type AuthState = {
  user: User | null;
  // null while logged out. A professional account has a document in `professionals/{uid}`.
  role: Role | null;
  // `admin: true` in the user's document (set by hand in the Firestore console; the rules check the same field)
  isAdmin: boolean;
  // A professional that created the account but didn't finish the profile yet (stays signed in)
  signupIncomplete: boolean;
  // The professional just sent the complete sign up: the screen tells them it is under review
  signupSubmitted: boolean;
  // true when the last sign in was a professional still waiting for an admin (that session is closed right away)
  pendingApproval: boolean;
  // The e-mail waiting for its code. The password stays only in memory, to sign in right after the code is accepted.
  verification: { email: string; password: string | null } | null;
  // false until Firebase tells us whether there is a session (and its role)
  ready: boolean;
};

export const initialAuthState: AuthState = {
  user: null,
  role: null,
  isAdmin: false,
  signupIncomplete: false,
  signupSubmitted: false,
  pendingApproval: false,
  verification: null,
  ready: false,
};

export type AuthAction =
  | { type: 'user'; user: User | null }
  | { type: 'resolved'; role: Role | null; isAdmin: boolean; signupIncomplete: boolean }
  | { type: 'pendingApproval'; value: boolean }
  | { type: 'signupSubmitted'; value: boolean }
  | { type: 'signupIncomplete'; value: boolean }
  | { type: 'verification'; value: AuthState['verification'] }
  | { type: 'ready' };

export const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'user':
      return { ...state, user: action.user };
    case 'resolved':
      return {
        ...state,
        role: action.role,
        isAdmin: action.isAdmin,
        signupIncomplete: action.signupIncomplete,
      };
    case 'pendingApproval':
      return { ...state, pendingApproval: action.value };
    case 'signupSubmitted':
      return { ...state, signupSubmitted: action.value };
    case 'signupIncomplete':
      return { ...state, signupIncomplete: action.value };
    case 'verification':
      return { ...state, verification: action.value };
    case 'ready':
      return { ...state, ready: true };
  }
};

export const guardStateOf = (state: AuthState): GuardState => ({
  signedIn: state.user !== null,
  role: state.role,
  isAdmin: state.isAdmin,
  signupIncomplete: state.signupIncomplete,
});
