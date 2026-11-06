import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { BackButton } from '../components/back-button';
import { Button } from '../components/button';
import { Screen } from '../components/screen';
import { TextField } from '../components/text-field';
import { useAuthActions } from '../contexts/auth';
import { t } from '../i18n';
import { fixed } from '../theme/colors';
import { useTheme } from '../theme/theme';
import { PATHS } from '../utils/paths';
import { authErrorMessage, isValidEmail } from '../utils/validators';

export default function ForgotPassword() {
  const theme = useTheme();
  const { sendPasswordReset } = useAuthActions();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState('');

  const invalid = !isValidEmail(email);

  const submit = async () => {
    setSubmitted(true);
    if (invalid) return;
    setFormError('');
    setSubmitting(true);
    try {
      await sendPasswordReset(email);
      setSent(true);
    } catch (error) {
      setFormError(authErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <BackButton />
      <Text accessibilityRole="header" style={[styles.title, { color: theme.text }]}>
        {t('Esqueci minha senha')}
      </Text>
      {sent ? (
        <>
          <Text style={{ color: theme.text }}>
            {t('Se existir uma conta com este e-mail, enviamos um link para criar uma nova senha.')}
          </Text>
          <Link href={PATHS.login as never} style={styles.link} accessibilityRole="link">
            {t('Voltar para o login')}
          </Link>
        </>
      ) : (
        <>
          <Text style={{ color: theme.muted }}>
            {t('Digite o e-mail da sua conta e enviaremos um link para criar uma nova senha.')}
          </Text>
          <TextField
            label={t('E-mail')}
            value={email}
            onChangeText={setEmail}
            error={submitted && invalid ? t('Digite um e-mail válido.') : undefined}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          {formError ? (
            <Text accessibilityRole="alert" style={styles.error}>
              {formError}
            </Text>
          ) : null}
          <Button label={t('Enviar link')} onPress={() => void submit()} loading={submitting} />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '700' },
  error: { color: fixed.dangerStrong },
  link: { color: fixed.accentText, textAlign: 'center', fontWeight: '600', padding: 8 },
});
