import { PATHS } from './paths';
import { Role } from './role';

// What the guards read from the Auth context
export type GuardState = {
  signedIn: boolean;
  role: Role | null;
  isAdmin: boolean;
  signupIncomplete: boolean;
};

export type Guard =
  'client' | 'clientArea' | 'clientEntry' | 'pro' | 'proEntry' | 'proInstagram' | 'admin';

// Where a screen sends the visitor instead of showing itself, or null when the visitor may stay.
// The same rules as the route guards of the site (src/app/guards). `proPath` is the same screen in the
// professional area, for the screens that exist in both.
export const guardRedirect = (
  guard: Guard,
  state: GuardState,
  options: { proPath?: string } = {},
): string | null => {
  switch (guard) {
    // Booking is for signed-in clients (the profile data is checked by the screen)
    case 'client':
      if (!state.signedIn) return PATHS.login;
      if (state.role === 'professional') return PATHS.proHome;
      return state.role === 'client' ? null : PATHS.home;
    // Every screen of the client (the start, the map, the search, a professional's page, the agenda, messages,
    // notifications, profile...) is closed to professionals.
    // Visitors get in: each screen tells them to sign in.
    case 'clientArea':
      return state.role === 'professional' ? (options.proPath ?? PATHS.proHome) : null;
    // The login and the sign up of the client
    case 'clientEntry':
      return state.role === 'professional' ? PATHS.proHome : null;
    // Only professional accounts get into the professional area
    case 'pro':
      if (state.role === 'professional') return null;
      if (state.signupIncomplete) return PATHS.proSignup;
      return state.signedIn ? PATHS.home : PATHS.proLogin;
    // The login and the sign up of the professional area
    case 'proEntry':
      if (state.role === 'client') return PATHS.home;
      if (state.role === 'professional') return PATHS.proHome;
      return null;
    // Instagram sends the professional back before the account is approved
    case 'proInstagram':
      if (state.role === 'professional' || state.signupIncomplete) return null;
      return state.signedIn ? PATHS.home : PATHS.proLogin;
    case 'admin':
      return state.isAdmin ? null : PATHS.home;
  }
};
