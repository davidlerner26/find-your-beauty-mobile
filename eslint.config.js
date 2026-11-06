const expoConfig = require('eslint-config-expo/flat');
const a11y = require('eslint-plugin-react-native-a11y');

module.exports = [
  ...expoConfig,
  {
    ignores: ['dist/*', '.expo/*', 'node_modules/*'],
  },
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { 'react-native-a11y': a11y },
    rules: {
      // The accessibility rules are errors, as in the site
      ...Object.fromEntries(
        Object.keys(a11y.rules).map((rule) => [`react-native-a11y/${rule}`, 'error']),
      ),
      // A label is enough for a spinner or an icon; a hint on every labelled element is noise for screen readers
      'react-native-a11y/has-accessibility-hint': 'off',
      // `log.error(...)`, not `console.error(...)`
      'no-console': 'error',
      'no-empty': ['error', { allowEmptyCatch: false }],
    },
  },
  {
    // Where console is the sink of the logger and of the scripts
    files: ['src/utils/log.ts', 'src/utils/log.spec.ts', 'scripts/**'],
    rules: { 'no-console': 'off' },
  },
];
