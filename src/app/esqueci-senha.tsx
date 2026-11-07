import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AuthField, AuthScreen, FormError } from '../components/auth-kit';
import { Button } from '../components/button';
import { Link } from '../components/link';
import { Text } from '../components/text';
import { useAuthActions } from '../contexts/auth';
import { t } from '../i18n';
import { fixed } from '../theme/colors';
import { PATHS } from '../utils/paths';
import { authErrorMessage, isValidEmail } from '../utils/validators';

export default function ForgotPassword() {
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
    <AuthScreen
      title={t('Esqueceu a senha?')}
      subtitle={t('Digite seu e-mail abaixo e enviaremos um link para você criar uma nova senha.')}
      free={false}
    >
      <AuthField
        icon="mail"
        placeholder={t('E-mail')}
        value={email}
        onChangeText={setEmail}
        error={submitted && invalid ? t('Digite um e-mail válido.') : undefined}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />
      {sent ? (
        <Text style={styles.success}>
          {t(
            'Se o e-mail estiver cadastrado, você vai receber o link em instantes. Confira também o spam.',
          )}
        </Text>
      ) : null}
      {formError ? <FormError>{formError}</FormError> : null}
      <View style={styles.submit}>
        <Button
          label={submitting ? t('Enviando...') : sent ? t('Enviar novamente') : t('Enviar link')}
          onPress={() => void submit()}
          loading={submitting}
        />
      </View>
      <Link href={PATHS.login as never} accessibilityRole="link" style={styles.back}>
        {t('Voltar para o login')}
      </Link>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  submit: { marginTop: 8 },
  success: {
    padding: 14,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#e8edf3',
    color: fixed.brand,
    fontSize: 14,
  },
  back: { textAlign: 'center', color: fixed.brand, fontWeight: '600', fontSize: 16, padding: 4 },
});
