import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { httpsCallable } from 'firebase/functions';
import { environment } from '../config/environment';
import { instagramAuthorizeUrl, parseInstagramReturn } from '../utils/instagram-oauth';
import { functions } from './firebase';

const STATE_KEY = 'instagram-oauth-state';

const call = <Request, Response>(name: string) => httpsCallable<Request, Response>(functions, name);

export const instagramAvailable = !!environment.instagramAppId;

// Where Instagram sends the professional back after they allow the access. It has to be listed in the Meta app as a
// valid OAuth redirect URI.
export const instagramRedirectUri = () => Linking.createURL('pro/instagram');

export type InstagramConnection =
  { ok: true; username: string; photos: number } | { ok: false; reason: string };

// Opens Instagram to allow the access, then trades the code that comes back for the connection (the Cloud
// Functions keep the token and copy the photos to our Storage)
export const connectInstagram = async (): Promise<InstagramConnection | null> => {
  const state = Crypto.randomUUID();
  await AsyncStorage.setItem(STATE_KEY, state);
  const redirectUri = instagramRedirectUri();

  const result = await WebBrowser.openAuthSessionAsync(
    instagramAuthorizeUrl(environment.instagramAppId, redirectUri, state),
    redirectUri,
  );
  // Closed without allowing: nothing to say
  if (result.type !== 'success') return null;

  const returned = parseInstagramReturn(result.url);
  if (!returned.ok) return { ok: false, reason: returned.reason };

  const expected = await AsyncStorage.getItem(STATE_KEY);
  await AsyncStorage.removeItem(STATE_KEY);
  if (!expected || expected !== returned.state) return { ok: false, reason: 'invalid-state' };

  const { data } = await call<
    { code: string; redirectUri: string },
    { username: string; photos: number }
  >('connectInstagram')({ code: returned.code, redirectUri });
  return { ok: true, ...data };
};

export const refreshInstagram = async () =>
  (await call<void, { photos: number }>('refreshInstagram')()).data;

export const disconnectInstagram = () => call<void, void>('disconnectInstagram')();
