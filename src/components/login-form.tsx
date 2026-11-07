import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useAuthActions } from '../contexts/auth';
import { t } from '../i18n';
import { useTheme } from '../theme/theme';
import { hasErrors, validateLogin } from '../utils/auth-forms';
import { errorCode } from '../utils/error-code';
import { PATHS } from '../utils/paths';
import { authErrorMessage } from '../utils/validators';
import { AuthField, AuthScreen, FormError } from './auth-kit';
import { Button } from './button';
import { GoogleButton } from './google-button';
import { Guard } from './guard';
import { Link } from './link';
import { Text } from './text';

// The login of the client, or of the professional area (`pro`): each one only takes the accounts of its own area
export function LoginForm({ pro = false }: { pro?: boolean }) {
  return (
    <Guard kind={pro ? 'proEntry' : 'clientEntry'}>
      <AuthScreen
        pro={pro}
        area="login"
        title={pro ? t('Área do profissional') : t('Bem-vindo de volta')}
        subtitle={
          pro
            ? t('Entre para gerenciar sua agenda e seus clientes.')
            : t('Que bom te ver de novo! Entre para usar o app.')
        }
      >
        <Login pro={pro} />
      </AuthScreen>
    </Guard>
  );
}

function Login({ pro }: { pro: boolean }) {
  const router = useRouter();
  const theme = useTheme();
  const { signInClient, signInProfessional, signInWithGoogle } = useAuthActions();
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
    <>
      <AuthField
        icon="mail"
        placeholder={t('E-mail')}
        value={email}
        onChangeText={setEmail}
        error={errors.email}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
      />
      <AuthField
        icon="lock"
        placeholder={t('Senha')}
        value={password}
        onChangeText={setPassword}
        error={errors.password}
        secret
        autoCapitalize="none"
        autoComplete="current-password"
        textContentType="password"
      />
      <View style={styles.options}>
        <Link
          href={'/esqueci-senha' as never}
          accessibilityRole="link"
          style={[styles.forgot, { color: theme.primary }]}
        >
          {t('Esqueceu a senha?')}
        </Link>
      </View>
      {formError ? <FormError>{formError}</FormError> : null}

      <View style={styles.submit}>
        <Button
          label={submitting ? t('Aguarde...') : t('Entrar')}
          onPress={() => void submit()}
          loading={submitting}
        />
      </View>

      <GoogleButton
        label={t('Entrar com Google')}
        run={async () => {
          const signedIn = await signInWithGoogle(pro ? 'professional' : 'client');
          if (signedIn) router.replace((pro ? PATHS.proHome : PATHS.home) as never);
          return signedIn;
        }}
      />

      <Text style={[styles.switch, { color: theme.text }]}>
        {t('Não tem uma conta?')}{' '}
        <Link
          href={(pro ? PATHS.proSignup : PATHS.signup) as never}
          accessibilityRole="link"
          style={[styles.switchLink, { color: theme.primary }]}
        >
          {t('Cadastre-se')}
        </Link>
      </Text>

      {pro ? null : (
        <Button
          variant="outline"
          label={t('Continuar como visitante')}
          onPress={() => router.replace(PATHS.home as never)}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  options: { flexDirection: 'row', justifyContent: 'flex-end' },
  forgot: { fontSize: 14 },
  submit: { marginTop: 8 },
  switch: { textAlign: 'center', fontSize: 16 },
  switchLink: { fontWeight: '600' },
});
