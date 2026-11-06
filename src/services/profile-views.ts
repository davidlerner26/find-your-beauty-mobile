import AsyncStorage from '@react-native-async-storage/async-storage';
import { httpsCallable } from 'firebase/functions';
import { log } from '../utils/log';
import { shouldCountView } from '../utils/view-window';
import { functions } from './firebase';

const KEY = 'viewed-professionals';
const call = httpsCallable<{ professionalId: string }, { counted: boolean }>(
  functions,
  'registerView',
);

// Counts the visits to the page of a professional (the Cloud Function adds one to their `views`)
export const registerView = async (id: string) => {
  let stored: Record<string, number> = {};
  try {
    stored = JSON.parse((await AsyncStorage.getItem(KEY)) ?? '{}');
  } catch (error) {
    log.warn('Failed to read the visits already counted', error);
  }
  const result = shouldCountView(stored, id);
  if (!result.count) return;
  await AsyncStorage.setItem(KEY, JSON.stringify(result.stored)).catch((error) =>
    log.warn('Failed to remember the visit', error),
  );
  try {
    await call({ professionalId: id });
  } catch (error) {
    log.error('Failed to count the visit', error);
  }
};
