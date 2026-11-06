import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';
import { environment, FUNCTIONS_REGION } from '../config/environment';

const existing = getApps().length > 0;
const firebaseApp = existing ? getApp() : initializeApp(environment.firebase);

export const db = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp);
// The session is kept in AsyncStorage (the app stays signed in, like "Lembrar de mim" on the site)
export const firebaseAuth = existing
  ? getAuth(firebaseApp)
  : initializeAuth(firebaseApp, { persistence: getReactNativePersistence(AsyncStorage) });
export const functions = getFunctions(firebaseApp, FUNCTIONS_REGION);
