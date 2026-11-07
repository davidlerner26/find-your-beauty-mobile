# Architecture

How the app is organized and the reasons for the choices that are not obvious. The site
([find-your-beauty](../../find-your-beauty/docs/architecture.md)) is the reference: the app is another client of the
same backend, so the Firestore rules and the Cloud Functions are not changed from here.

## Layout

```
src/
  app/          Expo Router: one file per screen, the same addresses as the site (see utils/paths.ts)
  components/   pieces shared by screens (Guard, ...)
  contexts/     app-wide state: Auth (state + actions in two contexts)
  services/     Firebase access (firebase, users, professional-accounts, ...)
  models/       types, plus converters.ts (Firestore documents -> models)
  utils/        pure helpers (cpf, money, phone, role, guards, ...), log, PATHS
  theme/        the tokens of the site (colors.ts) and the client / professional themes
  i18n/         pt (source), en, es
  config/       environment (Firebase project)
shared/         domain.ts: a copy of the site's file (npm run sync:shared)
```

## Decisions

**Expo Router, Firebase JS SDK.** The SDK is the same as the site's, so the services are almost the same code and the
app runs in Expo Go. The session is kept in AsyncStorage (`getReactNativePersistence`), so the app stays signed in; the
site's "do not remember me" option does not exist. Google sign in and Stripe need a development build.

**State: Context + `useReducer`, no library.** `Auth` is a provider with two contexts (state and actions), so a screen
that only signs in does not render again when the state changes. The reducer is a pure exported function with a spec.
`SearchStore` and `BookingFlowStore` of the site become a context + reducer each, with the provider close to the
screens that use it. Values the actions need right after changing them (the role resolved by a sign in) are kept in a
ref written by callbacks: the reducer state only shows up after the next render.

**Pure logic outside the components.** Filtering, slots, roles and guard rules are functions with specs, ported from
the site with their tests (`utils/`, `models/`). `guardRedirect` holds the rules of the site's route guards; the
`<Guard>` component only applies them to a screen.

**Screens never touch Firestore.** Same rule as the site: reads and writes go through `src/services`.
`models/converters.ts` is the only place where a document is trusted to have the shape of a model.

**Texts and languages.** Portuguese is the source and its text is the i18next key (the way `$localize` works on the
site): `t('Texto')`. A text without translation is shown as written. The language is the device's (`pt` unless it is
English or Spanish, `utils/locale.ts`).

**Look of the site.** The font is Mulish like the site: every screen draws its text with `components/text.tsx` (`Text`,
`TextInput`) and `components/link.tsx`, never with the ones of `react-native` / `expo-router`, because a custom font is one
file per weight and the components pick it from `fontWeight` (`theme/fonts.ts`). The root layout holds the splash until the
font is loaded. The bottom bar (`components/tab-bar.tsx`) is the one of the site: only icons, a dot under the selected one, a
dot of the accent color for news. The "Ambiente de teste" banner (`components/test-banner.tsx`, in the root layout) is a low tag stuck to the
top edge, in the middle of every screen (above the Dynamic Island), in the test environment. The screens of a
visitor use `components/visitor.tsx`. The sign in, sign up and password screens use `components/auth-kit.tsx`
(`AuthScreen`, `AuthField`): the pill fields, the switch between client and professional and the blue theme of the
professional area (`ThemeProvider pro`), as on the site. The sides of a screen are 24 px (`1.5rem` of the site) and the buttons are 56 px tall.

**Styles.** `theme/colors.ts` has the tokens of `src/styles.scss` of the site. The professional area wraps its
screens in `<ThemeProvider pro>`, which swaps `primary`, `text`, `muted`... like `body.pro-theme`.

**Search.** `SearchStore` of the site is `stores/search-reducer.ts` (pure reducer, with a spec) plus `stores/search.tsx`
(the provider keeps the recent searches in AsyncStorage and `useSearch` derives the results with `utils/search-filter.ts`).
The provider only wraps the search screen. The filter sheet edits a draft that only reaches the store on "Mostrar resultados".

**Booking.** `stores/booking-flow-reducer.ts` is the pure part of the site's `BookingFlowStore` (month, day, time, free times,
next day with a free time), tested; `stores/booking-flow.tsx` is the hook that loads the taken slots. The booking is
written by `services/bookings.ts` in one batch (the slots and the booking together, as the rules require). In the test
environment (`features.checkout`, off in production like the site) "Finalizar" goes to a **simulated** payment screen
and the booking is created by "Pagar agora" with `paymentStatus: 'pending'`. Saved cards and real holds use Stripe's
native SDK, which does not run in Expo Go: they come with the first development build, behind the same
`features.checkout` switch.

**Live data.** Bookings, conversations and notifications are contexts that follow Firestore (`contexts/`). Each list is
stored with the uid it belongs to, so the list of a previous account never shows for another one. Photos for the chat
are shrunk before upload (`services/images.ts`, `utils/image-size.ts`).

**Professional area.** Routes under `src/app/pro/`: `(tabs)` is the agenda (`/pro`), the messages and the profile; the login and
the sign up are outside the tabs. `LoginForm` and `SignupForm` serve both areas (`pro` prop) and the guards of
`utils/guards.ts` keep each account in its area. The second step of the sign up is the same editor as the profile
(`ProProfileForm signup`), shown by `/pro/cadastro` while `signupIncomplete`. The editor writes drafts the same way the
site does (`utils/profile-form.ts`, `utils/service-draft.ts`, ported with their specs); gallery photos are saved as soon
as they are added or removed. The address is found with the geocoder of the phone and written the way Google writes
the addresses of the site (`utils/address-format.ts`), because the neighborhood filter and the short address of the
cards read that format. The professional area keeps the light look of the client area for now (the site's blue theme
is not applied).

**Instagram.** `services/instagram.ts` opens the authorization in the system browser (`openAuthSessionAsync`) and sends
the code to the same Cloud Functions as the site. The redirect address has to be listed in the Meta app
(`Linking.createURL('pro/instagram')`: `findyourbeauty://pro/instagram` in a build); Meta may require an https address,
in which case the site needs a page that hands the code over to the app.

**Legal pages** are the pages of the site, opened in the in-app browser (`components/legal-screen.tsx`): one copy of the
text in three languages. **The address** of the sign up is checked by geocoding it (`expo-location`), since the site's
Google Places suggestions need a key restricted to the app.

**Translations** are checked by a spec (`i18n/translations.spec.ts`): every `t('...')` text of the code needs an English
and a Spanish entry with the same placeholders, and an entry nobody uses fails too. Many come from the site's
`messages.*.xlf`.

**Errors.** `log.error(message, error)` (`utils/log.ts`), never `console`.

## Plan

1. Foundation (done): repo, tooling, config, theme, i18n, Firebase, Auth, guards.
2. Client, read side (done): home, search with filters, map, professional page with reviews, onboarding, login, sign up, e-mail code, password reset, legal. Left for later phases: Google sign in (needs OAuth client ids), booking from the professional page (phase 3).
3. Client, transactions (done, except cards and real payments): booking, simulated payment, agenda, inbox and chat, notifications, profile. Cards and Stripe need a development build.
4. Professional area (done): sign up in 2 steps, agenda (accept, decline, cancel), messages, profile editor, Instagram connection.
5. Admin (done): the list of sign ups waiting for approval and the review of a professional (approve or deny).
6. Polish (done, except push): icons and splash from the site's mark, permission texts, EAS build profiles, an accessibility audit. Push notifications are a proposal below.

At the end of each phase the work stops until the next one is approved.

## Tests

| What                                          | Where              | Runs in                |
| --------------------------------------------- | ------------------ | ---------------------- |
| Pure logic, reducers, models, the shared copy | `src/**/*.spec.ts` | `npm test` (jest-expo) |

The tests run in Portuguese (`jest.setup.ts` mocks the device locale).

## Builds and what is still open

`eas.json` has three profiles: `development` (a development client, needed for Stripe and Google sign in), `preview`
(internal) and `production` (`EXPO_PUBLIC_APP_ENV=prod`, which selects the production Firebase project and turns
`features.checkout` off). The `EXPO_PUBLIC_FIREBASE_*` variables of production are set in EAS, never in the repo. Nothing
here is built or submitted without asking.

Open, each one needs an account, a console or a change outside this repo:

- **Identifier.** `br.com.findyourbeauty.app` (iOS and Android) is a proposal; it cannot be changed after the first store
  upload.
- **Google sign in.** The code is done (`services/google.ts`, the Google methods of `contexts/auth.tsx`, `components/google-button.tsx`,
  with the same rules as the site). It works only in a development or store build: Expo Go has no native module of Google, and
  there the button is hidden. The OAuth client ids of the test project are in `config/environment.ts` and the iOS URL scheme
  comes from `app.config.ts`. Still needed: the Android app with its SHA-1 in the Firebase console (so the Android OAuth client
  exists), the same two ids for production (`EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` and `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` in
  EAS), and, for the App Store, an equivalent option such as Sign in with Apple.
- **Android map.** `react-native-maps` on Android needs a Google Maps key for the app (`android.config.googleMaps.apiKey`);
  the key of the site is restricted to web referrers.
- **Stripe.** `@stripe/stripe-react-native` and saved cards, in a development build, behind `features.checkout`.
- **Instagram.** The redirect address in the Meta app (see above).
- **Push notifications (proposal).** `expo-notifications` to get a token, stored in `users/{uid}` (or `professionals/{id}/private`),
  and a Cloud Function (in the site's repo) that sends a push where it already writes `users/{uid}/notifications`. It needs
  a change in the backend, so it waits for a decision.
