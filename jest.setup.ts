// The tests run in Portuguese, the source language of the app (like the test build of the site)
jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'pt', languageTag: 'pt-BR' }],
}));

// A native module: the official mock keeps it in memory
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
