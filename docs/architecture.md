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
4. Professional area: sign up (2 steps), agenda, messages, notifications, profile editor, Instagram.
5. Admin: approvals.
6. Polish: push notifications, accessibility pass, EAS build config.

At the end of each phase the work stops until the next one is approved.

## Tests

| What                                          | Where              | Runs in                |
| --------------------------------------------- | ------------------ | ---------------------- |
| Pure logic, reducers, models, the shared copy | `src/**/*.spec.ts` | `npm test` (jest-expo) |

The tests run in Portuguese (`jest.setup.ts` mocks the device locale).
