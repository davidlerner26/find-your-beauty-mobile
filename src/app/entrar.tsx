import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BackButton } from '../components/back-button';
import { Button } from '../components/button';
import { Guard } from '../components/guard';
import { Screen } from '../components/screen';
import { TextField } from '../components/text-field';
import { useAuth, useAuthActions } from '../contexts/auth';
import { t } from '../i18n';
import { fixed } from '../theme/colors';
import { useTheme } from '../theme/theme';
import { hasErrors, validateLogin } from '../utils/auth-forms';
import { errorCode } from '../utils/error-code';
import { PATHS } from '../utils/paths';
import { authErrorMessage } from '../utils/validators';

export default function LoginScreen() {
  return (
    <Guard kind="clientEntry">
      <Login />
    </Guard>
  );
}

function Login() {
  const router = useRouter();
  const theme = useTheme();
  const auth = useAuth();
  const { signInClient } = useAuthActions();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Errors show after the first submit
  const errors = submitted ? validateLogin({ email, password }) : {};

  const submit = async () => {
    setSubmitted(true);
    if (hasErrors(validateLogin({ email, password }))) return;

    setFormError('');
    setSubmitting(true);
    try {
      await signInClient(email, password);
      router.replace(PATHS.home as never);
    } catch (error) {
      if (errorCode(error) === 'auth/email-not-verified') {
        router.replace(PATHS.verifyEmail as never);
        return;
      }
      setFormError(authErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  // A signed-in account never sees the form (the guard sends the professionals away; clients go to the start)
  if (auth.ready && auth.role === 'client') router.replace(PATHS.home as never);

  return (
    <Screen>
      <BackButton />
      <Text accessibilityRole="header" style={[styles.title, { color: theme.text }]}>
        {t('Entrar')}
      </Text>
      <Text style={{ color: theme.muted }}>
        {t('Entre para agendar e conversar com os profissionais.')}
      </Text>

      <TextField
        label={t('E-mail')}
        value={email}
        onChangeText={setEmail}
        error={errors.email}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
      />
      <TextField
        label={t('Senha')}
        value={password}
        onChangeText={setPassword}
        error={errors.password}
        secret
        autoCapitalize="none"
        autoComplete="current-password"
        textContentType="password"
      />
      {formError ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {formError}
        </Text>
      ) : null}

      <Button label={t('Entrar')} onPress={() => void submit()} loading={submitting} />
      <Link href={'/esqueci-senha' as never} style={styles.link} accessibilityRole="link">
        {t('Esqueci minha senha')}
      </Link>

      <View style={styles.switch}>
        <Text style={{ color: theme.muted }}>{t('Não tem uma conta?')} </Text>
        <Link href={PATHS.signup as never} accessibilityRole="link" style={styles.linkInline}>
          {t('Cadastre-se')}
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '700' },
  error: { color: fixed.dangerStrong },
  link: { color: fixed.accentText, textAlign: 'center', fontWeight: '600', padding: 8 },
  linkInline: { color: fixed.accentText, fontWeight: '600' },
  switch: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap' },
});
