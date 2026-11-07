import Constants, { ExecutionEnvironment } from 'expo-constants';
import { environment } from '../config/environment';
import { log } from '../utils/log';

// Expo Go does not have the native module of Google: the button only exists in a development build
export const googleAvailable =
  Constants.executionEnvironment !== ExecutionEnvironment.StoreClient &&
  !!environment.google.webClientId;

type Module = typeof import('@react-native-google-signin/google-signin');
let module_: Module | null = null;

// The module is loaded only where it exists (importing it in Expo Go would fail when the app starts)
const load = (): Module => {
  if (!module_) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    module_ = require('@react-native-google-signin/google-signin') as Module;
    module_.GoogleSignin.configure({
      webClientId: environment.google.webClientId,
      iosClientId: environment.google.iosClientId,
    });
  }
  return module_;
};

// Opens the Google account chooser. Returns the id token, or null when the person closed it.
export const googleIdToken = async (): Promise<string | null> => {
  const { GoogleSignin, isSuccessResponse } = load();
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const response = await GoogleSignin.signIn();
  if (!isSuccessResponse(response)) return null;
  if (!response.data.idToken) throw new Error('google-no-id-token');
  return response.data.idToken;
};

// Forgets the Google account the app used, so the next sign in asks which one to use
export const googleSignOut = async () => {
  if (!googleAvailable) return;
  try {
    await load().GoogleSignin.signOut();
  } catch (error) {
    log.warn('Failed to sign out of Google', error);
  }
};
