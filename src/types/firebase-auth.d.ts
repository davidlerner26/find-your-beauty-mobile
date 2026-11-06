import type { Persistence } from 'firebase/auth';

// Metro loads the React Native build of firebase/auth, which has `getReactNativePersistence`; the types of the
// default build do not. Declared here (types only) instead of a `paths` entry, which Metro and Jest would also follow.
declare module 'firebase/auth' {
  export function getReactNativePersistence(storage: {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
  }): Persistence;
}
