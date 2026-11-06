import { Link, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { BackButton } from '../components/back-button';
import { Button } from '../components/button';
import { Screen } from '../components/screen';
import { Spinner } from '../components/spinner';
import { TextField } from '../components/text-field';
import { useAuthActions } from '../contexts/auth';
import { t } from '../i18n';
import { fixed } from '../theme/colors';
import { useTheme } from '../theme/theme';
import { hasErrors, validateReset } from '../utils/auth-forms';
import { PATHS } from '../utils/paths';
import { authErrorMessage } from '../utils/validators';

// Firebase opens this screen from the e-mail link with ?mode=resetPassword&oobCode=...
export default function ResetPassword() {
  const theme = useTheme();
  const { mode, oobCode } = useLocalSearchParams<{ mode?: string; oobCode?: string }>();
  const { verifyResetCode, confirmPasswordReset } = useAuthActions();
  // A link without what Firebase puts in it is wrong before anything is asked
  const linkOk = mode === 'resetPassword' && !!oobCode;
  // loading while the code is checked, invalid when the link is wrong or expired
  const [checked, setChecked] = useState<'loading' | 'ready' | 'invalid' | 'done'>('loading');
  const state = linkOk ? checked : 'invalid';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!linkOk || !oobCode) return;
    verifyResetCode(oobCode)
      .then((address) => {
        setEmail(address);
        setChecked('ready');
      })
      .catch((error) => {
        setFormError(authErrorMessage(error));
        setChecked('invalid');
      });
  }, [linkOk, oobCode, verifyResetCode]);

  const errors = submitted ? validateReset({ password, confirmation }) : {};

  const submit = async () => {
    setSubmitted(true);
    if (hasErrors(validateReset({ password, confirmation })) || !oobCode) return;
    setFormError('');
    setSubmitting(true);
    try {
      await confirmPasswordReset(oobCode, password);
      setChecked('done');
    } catch (error) {
      setFormError(authErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  if (state === 'loading') return <Spinner />;

  return (
    <Screen>
      <BackButton />
      <Text accessibilityRole="header" style={[styles.title, { color: theme.text }]}>
        {t('Nova senha')}
      </Text>
      {state === 'invalid' ? (
        <>
          <Text accessibilityRole="alert" style={styles.error}>
            {formError || t('Este link não é válido. Peça um novo link de redefinição.')}
          </Text>
          <Link href={'/esqueci-senha' as never} style={styles.link} accessibilityRole="link">
            {t('Pedir um novo link')}
          </Link>
        </>
      ) : state === 'done' ? (
        <>
          <Text style={{ color: theme.text }}>
            {t('Senha alterada! Já pode entrar com a nova senha.')}
          </Text>
          <Link href={PATHS.login as never} style={styles.link} accessibilityRole="link">
            {t('Ir para o login')}
          </Link>
        </>
      ) : (
        <>
          <Text style={{ color: theme.muted }}>
            {t('Crie uma nova senha para {{email}}.', { email })}
          </Text>
          <TextField
            label={t('Nova senha')}
            value={password}
            onChangeText={setPassword}
            error={errors.password}
            secret
            autoCapitalize="none"
            autoComplete="new-password"
          />
          <TextField
            label={t('Confirme a nova senha')}
            value={confirmation}
            onChangeText={setConfirmation}
            error={errors.confirmation}
            secret
            autoCapitalize="none"
            autoComplete="new-password"
          />
          {formError ? (
            <Text accessibilityRole="alert" style={styles.error}>
              {formError}
            </Text>
          ) : null}
          <Button
            label={t('Salvar nova senha')}
            onPress={() => void submit()}
            loading={submitting}
          />
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
