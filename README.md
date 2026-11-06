# Find Your Beauty (mobile)

The mobile app of [Find Your Beauty](../find-your-beauty): a multilingual (Portuguese, English, Spanish)
marketplace that connects clients with makeup artists and hair stylists in Rio de Janeiro. It works like the site and
uses the same Firebase project, security rules and Cloud Functions.

Expo (React Native) · TypeScript · Expo Router · Firebase JS SDK · React Context + `useReducer`.

- How the code is organized and why: [docs/architecture.md](docs/architecture.md)

## Getting started

Node 22+ and npm. The site must be cloned next to this repo (`../find-your-beauty`): `shared/domain.ts` is copied
from it.

```bash
npm install
npm start          # Expo dev server, against the Firebase of the TEST environment
```

Open it in the iOS simulator (`i`), the Android emulator (`a`) or Expo Go. It never touches production: production
needs `EXPO_PUBLIC_APP_ENV=prod` and the `EXPO_PUBLIC_FIREBASE_*` variables (see `src/config/environment.ts`).

## Scripts

| Command                                 | What it does                                           |
| --------------------------------------- | ------------------------------------------------------ |
| `npm start`                             | Expo dev server (test Firebase project)                |
| `npm run ios` / `npm run android`       | Same, opening the simulator / emulator                 |
| `npm test`                              | Unit tests (Jest, `jest-expo`)                         |
| `npm run lint` / `npm run format:check` | ESLint (Expo, accessibility) / Prettier                |
| `npm run typecheck`                     | TypeScript                                             |
| `npm run sync:shared` / `check:shared`  | Copy `shared/domain.ts` from the site / check the copy |
