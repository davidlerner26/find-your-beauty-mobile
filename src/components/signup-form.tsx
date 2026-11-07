import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useAuthActions } from '../contexts/auth';
import { t } from '../i18n';
import { useTheme } from '../theme/theme';
import { hasErrors, SignupValues, validateSignup } from '../utils/auth-forms';
import { formatCpf } from '../utils/cpf';
import { log } from '../utils/log';
import { formatPhone } from '../utils/phone';
import { PATHS } from '../utils/paths';
import { authErrorMessage } from '../utils/validators';
import { AuthField, AuthScreen, FormError } from './auth-kit';
import { Button } from './button';
import { Guard } from './guard';
import { Link } from './link';
import { Text } from './text';

// The sign up of the client, or the first step of the one of the professional (`pro`): the professional gives the
// address and the rest of the profile in the second step
export function SignupForm({ pro = false }: { pro?: boolean }) {
  return (
    <Guard kind={pro ? 'proEntry' : 'clientEntry'}>
      <AuthScreen
        pro={pro}
        area="signup"
        title={pro ? t('Cadastro de profissional') : t('Crie uma conta')}
        subtitle={
          pro
            ? t(
                'Crie a conta do profissional. No próximo passo você completa o perfil: foto, endereço e serviços.',
              )
            : t('Preencha todas as informações abaixo para criar sua conta.')
        }
      >
        <Signup pro={pro} />
      </AuthScreen>
    </Guard>
  );
}

function Signup({ pro }: { pro: boolean }) {
  const router = useRouter();
  const theme = useTheme();
  const { signUpWithEmail, signUpProfessional } = useAuthActions();
  const [values, setValues] = useState<SignupValues>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    cpf: '',
    password: '',
  });
  const [address, setAddress] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [addressError, setAddressError] = useState('');

  const set = (field: keyof SignupValues) => (value: string) =>
    setValues((current) => ({ ...current, [field]: value }));
  const errors = submitted ? validateSignup(values) : {};

  // The address has to be one that exists: it is searched, and the position found is what is saved
  const findAddress = async () => {
    try {
      const [found] = await Location.geocodeAsync(address.trim());
      return found ? { lat: found.latitude, lng: found.longitude } : null;
    } catch (error) {
      log.warn('Failed to find the address', error);
      return null;
    }
  };

  const submit = async () => {
    setSubmitted(true);
    const invalid = hasErrors(validateSignup(values));
    if (!pro && !address.trim()) {
      setAddressError(t('Digite o seu endereço.'));
      return;
    }
    if (invalid) return;

    setFormError('');
    setAddressError('');
    setSubmitting(true);
    try {
      if (pro) {
        // The account is created here; the profile is completed in the second step (the screen shows it)
        await signUpProfessional(values);
        return;
      }
      const addressPosition = await findAddress();
      if (!addressPosition) {
        setAddressError(t('Não encontramos esse endereço. Inclua a rua, o número e a cidade.'));
        return;
      }
      await signUpWithEmail({ ...values, address: address.trim(), addressPosition });
      router.replace(PATHS.verifyEmail as never);
    } catch (error) {
      setFormError(authErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const link = { color: theme.primary, fontWeight: '600' as const };

  return (
    <>
      <AuthField
        icon="person"
        placeholder={t('Nome')}
        value={values.firstName}
        onChangeText={set('firstName')}
        error={errors.firstName}
        autoComplete="given-name"
        textContentType="givenName"
      />
      <AuthField
        icon="person"
        placeholder={t('Sobrenome')}
        value={values.lastName}
        onChangeText={set('lastName')}
        error={errors.lastName}
        autoComplete="family-name"
        textContentType="familyName"
      />
      <AuthField
        icon="mail"
        placeholder={t('E-mail')}
        value={values.email}
        onChangeText={set('email')}
        error={errors.email}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
      />
      <AuthField
        icon="call"
        placeholder={t('Celular')}
        value={values.phone}
        onChangeText={(value) => set('phone')(formatPhone(value))}
        error={errors.phone}
        keyboardType="phone-pad"
        autoComplete="tel"
        textContentType="telephoneNumber"
      />
      <AuthField
        icon="badge"
        placeholder="CPF"
        value={values.cpf}
        onChangeText={(value) => set('cpf')(formatCpf(value))}
        error={errors.cpf}
        keyboardType="number-pad"
      />
      {pro ? null : (
        <AuthField
          icon="location-on"
          placeholder={t('Endereço')}
          value={address}
          onChangeText={(value) => {
            setAddress(value);
            setAddressError('');
          }}
          error={addressError}
          autoComplete="street-address"
          textContentType="fullStreetAddress"
        />
      )}
      <AuthField
        icon="lock"
        placeholder={t('Senha')}
        value={values.password}
        onChangeText={set('password')}
        error={errors.password}
        secret
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
      />
      {formError ? <FormError>{formError}</FormError> : null}

      <View style={styles.submit}>
        <Button
          label={submitting ? t('Aguarde...') : t('Cadastrar')}
          onPress={() => void submit()}
          loading={submitting}
        />
      </View>

      <Text style={[styles.legal, { color: theme.muted }]}>
        {t('Ao criar a conta você concorda com os')}{' '}
        <Link href={'/termos' as never} style={link}>
          {t('Termos de Uso')}
        </Link>{' '}
        {t('e a')}{' '}
        <Link href={'/privacidade' as never} style={link}>
          {t('Política de Privacidade')}
        </Link>
        .
      </Text>

      <Text style={[styles.switch, { color: theme.text }]}>
        {t('Já tem uma conta?')}{' '}
        <Link
          href={(pro ? PATHS.proLogin : PATHS.login) as never}
          accessibilityRole="link"
          style={link}
        >
          {t('Entrar')}
        </Link>
      </Text>
    </>
  );
}

const styles = StyleSheet.create({
  submit: { marginTop: 8 },
  legal: { fontSize: 13, textAlign: 'center' },
  switch: { textAlign: 'center', fontSize: 16 },
});
