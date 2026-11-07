# Working in this repository

This is the mobile app (Expo, React Native, TypeScript) of the site in `../find-your-beauty`. It must work the same
way as the site: same Firebase project, same rules, same Cloud Functions. Read [README.md](README.md) for the
commands, [docs/architecture.md](docs/architecture.md) for the structure and [AGENTS.md](AGENTS.md) for the Expo
notes (Expo changes a lot: check the docs of the installed SDK before using an API).

## Rules

- **Language.** Code, comments, commit messages and `docs/architecture.md` in English. The user speaks Portuguese:
  answer in Portuguese. Texts in the UI are written in Portuguese and translated (see "Texts" in the architecture
  doc). Never write "a cliente" / "as clientes" in pt/es texts: use a neutral or masculine form.
- **Commits.** Commit every change at the end of the work, with a short English message ending with the line
  `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>` (in the first commit command, never added afterwards).
  Before each commit, summarize the files touched and what was done. Do not push.
- **Ask before** deploying anything, running an EAS build or submitting to a store, changing the Meta/Google
  consoles, or doing anything outward facing. The backend (rules, Functions) lives in the site's repo: this repo
  never changes it.
- **Phases.** The work is done in phases (see the plan in the architecture doc). At the end of a phase, stop,
  report what was done and what failed, and ask before starting the next one.
- **Verify before saying it works.** Run what touches the change: `npm run lint`, `npm run format:check`,
  `npm run typecheck`, `npm test`, and for anything a user can see run the app (simulator or Expo Go).
  Report what failed.

## Conventions

- A screen does not import `firebase/firestore`: add a method to a service in `src/services`.
- Pure logic goes in a function with a spec, not in the component. State of a screen with rules is a context +
  `useReducer` (no state library), with the reducer exported and tested.
- `log.error(...)`, not `console.error(...)`. Do not swallow errors with an empty `catch`.
- Routes with `PATHS`, collections with `COLLECTIONS`, booking statuses with the helpers of `shared/domain.ts`.
- `shared/domain.ts` is a copy of the site's file: never edit it here, run `npm run sync:shared`.
- Install packages with `npx expo install` (it picks the version that matches the SDK).
- Interactive elements need an `accessibilityRole` and a label (the `react-native-a11y` rules are errors).
- Colors come from `src/theme/colors.ts` (the tokens of the site), never a hex written in a component.
- Text and links: `Text`, `TextInput` from `src/components/text` and `Link` from `src/components/link` (the font of the site), not the ones of `react-native` / `expo-router`.
- Texts: `t('Texto em português')` from `src/i18n`; add the English and Spanish translations to `en.ts` / `es.ts`.

## Gotchas

- `ng test`-style mocks do not exist here: use `jest.mock` for native modules (see `jest.setup.ts`).
- Types of `firebase/auth` come from the React Native build by a declaration in `src/types/firebase-auth.d.ts`
  (`getReactNativePersistence` is not in the default types).
- `.npmrc` has `legacy-peer-deps=true` (the a11y ESLint plugin declares ESLint <= 8 as a peer), so npm does not install
  peer dependencies by itself: if a tool asks for one (like `@react-native/jest-preset`), install it.
- Google sign in and Stripe need a development build, not Expo Go.
