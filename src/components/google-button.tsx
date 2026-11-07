import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { t } from '../i18n';
import { googleAvailable } from '../services/google';
import { fixed, radius } from '../theme/colors';
import { errorCode } from '../utils/error-code';
import { log } from '../utils/log';
import { authErrorMessage } from '../utils/validators';
import { FormError } from './auth-kit';
import { Text } from './text';
import { useTheme } from '../theme/theme';

// The errors of Google that say what to do; anything else is "try again"
const KNOWN = [
  'auth/not-professional',
  'auth/not-client',
  'auth/professional-not-registered',
  'auth/pending-approval',
  'auth/account-is-client',
];

// "ou" and the button to sign in or sign up with a Google account. Only in a development or store build: Expo Go
// does not have the native module of Google, so there the button does not show.
export function GoogleButton({
  label,
  run,
}: {
  label: string;
  // Resolves to true when the person is signed in, false when they closed the Google window
  run: () => Promise<boolean>;
}) {
  const theme = useTheme();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (!googleAvailable) return null;

  const press = async () => {
    setError('');
    setBusy(true);
    try {
      await run();
    } catch (failure) {
      const code = errorCode(failure);
      if (KNOWN.includes(code ?? '')) setError(authErrorMessage(failure));
      else {
        log.error('Failed to sign in with Google', failure);
        setError(t('Não foi possível entrar com o Google. Tente novamente.'));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <View style={styles.divider}>
        <View style={[styles.line, { backgroundColor: theme.line }]} />
        <Text style={{ color: theme.muted }}>{t('ou')}</Text>
        <View style={[styles.line, { backgroundColor: theme.line }]} />
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ busy }}
        disabled={busy}
        onPress={() => void press()}
        style={[styles.button, { borderColor: theme.primary, opacity: busy ? 0.6 : 1 }]}
      >
        <Image
          accessibilityIgnoresInvertColors
          source={require('../../assets/images/google.png')}
          style={styles.logo}
        />
        <Text style={styles.label}>{label}</Text>
      </Pressable>
      {error ? <FormError>{error}</FormError> : null}
    </>
  );
}

const styles = StyleSheet.create({
  divider: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  line: { flex: 1, height: 1 },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    height: 56,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    backgroundColor: fixed.white,
  },
  logo: { width: 21, height: 21 },
  label: { fontSize: 17, color: fixed.brand },
});
