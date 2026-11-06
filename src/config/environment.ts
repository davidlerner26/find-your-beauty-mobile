// Public identifiers of the Firebase web app of the TEST project (find-your-beauty-dev), the same ones the site's
// environment.dev.ts has. They are public by design: the security rules are the real backend.
// Production is selected with EXPO_PUBLIC_APP_ENV=prod plus the EXPO_PUBLIC_FIREBASE_* variables (set through EAS).
const dev = {
  name: 'dev' as 'dev' | 'prod',
  siteUrl: 'https://dev.findyourbeauty.com.br',
  // Features that are only on in the test environment for now (production has them off, like the site)
  features: { featuredProfessionals: true, checkout: true },
  firebase: {
    apiKey: 'AIzaSyBwamplQdQ7d2BYMuD56DfVigkO1fuSpEw',
    authDomain: 'find-your-beauty-dev.firebaseapp.com',
    projectId: 'find-your-beauty-dev',
    storageBucket: 'find-your-beauty-dev.firebasestorage.app',
    messagingSenderId: '508397329043',
    appId: '1:508397329043:web:83e4a0ac4f69c17d8a8b66',
  },
};

const env = process.env;

export const environment =
  env.EXPO_PUBLIC_APP_ENV === 'prod'
    ? {
        name: 'prod' as const,
        siteUrl: env.EXPO_PUBLIC_SITE_URL ?? 'https://findyourbeauty.com.br',
        features: { featuredProfessionals: false, checkout: false },
        firebase: {
          apiKey: env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
          authDomain: env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
          projectId: env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
          storageBucket: env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
          messagingSenderId: env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
          appId: env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
        },
      }
    : dev;

// The region of the Cloud Functions
export const FUNCTIONS_REGION = 'southamerica-east1';
