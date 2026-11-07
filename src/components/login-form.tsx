import { useRouter } from 'expo-router';
import { Link } from './link';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from './text';
import { BackButton } from './back-button';
import { Button } from './button';
import { Guard } from './guard';
import { Screen } from './screen';
import { TextField } from './text-field';
import { useAuthActions } from '../contexts/auth';
import { t } from '../i18n';
import { fixed } from '../theme/colors';
import { useTheme } from '../theme/theme';
import { hasErrors, validateLogin } from '../utils/auth-forms';
import { errorCode } from '../utils/error-code';
import { PATHS } from '../utils/paths';
import { authErrorMessage } from '../utils/validators';

// The login of the client, or of the professional area (`pro`): each one only takes the accounts of its own area
export function LoginForm({ pro = false }: { pro?: boolean }) {
  return (
    <Guard kind={pro ? 'proEntry' : 'clientEntry'}>
      <Login pro={pro} />
    </Guard>
  );
}

function Login({ pro }: { pro: boolean }) {
  const router = useRouter();
  const theme = useTheme();
  const { signInClient, signInProfessional } = useAuthActions();
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
      if (pro) {
        await signInProfessional(email, password);
        router.replace(PATHS.proHome as never);
      } else {
        await signInClient(email, password);
        router.replace(PATHS.home as never);
      }
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

  return (
    <Screen>
      <BackButton />
      <Text accessibilityRole="header" style={[styles.title, { color: theme.text }]}>
        {pro ? t('Entrar como profissional') : t('Entrar')}
      </Text>
      <Text style={{ color: theme.muted }}>
        {pro
          ? t('Entre para ver os seus agendamentos e cuidar do seu perfil.')
          : t('Entre para agendar e conversar com os profissionais.')}
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

      <Link
        href={(pro ? PATHS.login : PATHS.proLogin) as never}
        accessibilityRole="link"
        style={styles.link}
      >
        {pro ? t('Sou cliente') : t('Sou profissional')}
      </Link>

      <View style={styles.switch}>
        <Text style={{ color: theme.muted }}>{t('Não tem uma conta?')} </Text>
        <Link
          href={(pro ? PATHS.proSignup : PATHS.signup) as never}
          accessibilityRole="link"
          style={styles.linkInline}
        >
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
