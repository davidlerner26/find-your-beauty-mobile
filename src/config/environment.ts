// Public identifiers of the Firebase web app of the TEST project (find-your-beauty-dev), the same ones the site's
// environment.dev.ts has. They are public by design: the security rules are the real backend.
// Production is selected with EXPO_PUBLIC_APP_ENV=prod plus the EXPO_PUBLIC_FIREBASE_* variables (set through EAS).
const dev = {
  name: 'dev' as 'dev' | 'prod',
  siteUrl: 'https://dev.findyourbeauty.com.br',
  // Features that are only on in the test environment for now (production has them off, like the site)
  features: { featuredProfessionals: true },
  // Instagram API with Instagram Login: the same Meta app as the site (the id is public)
  instagramAppId: '1138530759119798',
  // OAuth clients of the Firebase project (Google Cloud Console > Credentials). They are public identifiers.
  google: {
    webClientId: '508397329043-ffd9ipq2arkgd6eseumtv2idhqp2mn1m.apps.googleusercontent.com',
    iosClientId: '508397329043-1ns5lec0e73406h95r0dtq73tat9r06k.apps.googleusercontent.com',
  },
  // Google Places (the address search). The key of the apps is restricted to them (bundle id and package), so it is not
  // the one of the site: it comes from EXPO_PUBLIC_GOOGLE_MAPS_API_KEY. Without it the address is a plain field.
  maps: { apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '' },
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
        features: { featuredProfessionals: false },
        instagramAppId: env.EXPO_PUBLIC_INSTAGRAM_APP_ID ?? '',
        google: {
          webClientId: env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '',
          iosClientId: env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '',
        },
        maps: { apiKey: env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '' },
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
