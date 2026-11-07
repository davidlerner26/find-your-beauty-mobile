import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AuthField, AuthScreen, FormError } from '../components/auth-kit';
import { Button } from '../components/button';
import { Link } from '../components/link';
import { Spinner } from '../components/spinner';
import { useAuthActions } from '../contexts/auth';
import { t } from '../i18n';
import { fixed } from '../theme/colors';
import { hasErrors, validateReset } from '../utils/auth-forms';
import { PATHS } from '../utils/paths';
import { authErrorMessage } from '../utils/validators';

// Firebase opens this screen from the e-mail link with ?mode=resetPassword&oobCode=...
export default function ResetPassword() {
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

  if (state === 'invalid') {
    return (
      <AuthScreen
        title={t('Link inválido')}
        subtitle={formError || t('Este link não é válido. Peça um novo link de redefinição.')}
        free={false}
      >
        <Link href={'/esqueci-senha' as never} accessibilityRole="link" style={styles.link}>
          {t('Pedir um novo link')}
        </Link>
      </AuthScreen>
    );
  }

  if (state === 'done') {
    return (
      <AuthScreen
        title={t('Senha alterada')}
        subtitle={t('Senha alterada! Já pode entrar com a nova senha.')}
        free={false}
      >
        <Link href={PATHS.login as never} accessibilityRole="link" style={styles.link}>
          {t('Ir para o login')}
        </Link>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen
      title={t('Nova senha')}
      subtitle={t('Crie uma nova senha para {{email}}.', { email })}
      free={false}
    >
      <AuthField
        icon="lock"
        placeholder={t('Nova senha')}
        value={password}
        onChangeText={setPassword}
        error={errors.password}
        secret
        autoCapitalize="none"
        autoComplete="new-password"
      />
      <AuthField
        icon="lock"
        placeholder={t('Confirme a nova senha')}
        value={confirmation}
        onChangeText={setConfirmation}
        error={errors.confirmation}
        secret
        autoCapitalize="none"
        autoComplete="new-password"
      />
      {formError ? <FormError>{formError}</FormError> : null}
      <View style={styles.submit}>
        <Button label={t('Salvar nova senha')} onPress={() => void submit()} loading={submitting} />
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  submit: { marginTop: 8 },
  link: { color: fixed.brand, fontWeight: '600', fontSize: 16, textAlign: 'center', padding: 4 },
});
