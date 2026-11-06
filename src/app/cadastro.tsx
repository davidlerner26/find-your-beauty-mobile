import { Link, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BackButton } from '../components/back-button';
import { Button } from '../components/button';
import { Guard } from '../components/guard';
import { Screen } from '../components/screen';
import { TextField } from '../components/text-field';
import { useAuthActions } from '../contexts/auth';
import { t } from '../i18n';
import { fixed } from '../theme/colors';
import { useTheme } from '../theme/theme';
import { hasErrors, SignupValues, validateSignup } from '../utils/auth-forms';
import { formatCpf } from '../utils/cpf';
import { log } from '../utils/log';
import { formatPhone } from '../utils/phone';
import { PATHS } from '../utils/paths';
import { authErrorMessage, PASSWORD_RULE } from '../utils/validators';

export default function SignupScreen() {
  return (
    <Guard kind="clientEntry">
      <Signup />
    </Guard>
  );
}

function Signup() {
  const router = useRouter();
  const theme = useTheme();
  const { signUpWithEmail } = useAuthActions();
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
    if (!address.trim()) {
      setAddressError(t('Digite o seu endereço.'));
      return;
    }
    if (invalid) return;

    setFormError('');
    setAddressError('');
    setSubmitting(true);
    try {
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

  return (
    <Screen>
      <BackButton />
      <Text accessibilityRole="header" style={[styles.title, { color: theme.text }]}>
        {t('Criar conta')}
      </Text>
      <Text style={{ color: theme.muted }}>{t('O Find Your Beauty é 100% gratuito.')}</Text>

      <TextField
        label={t('Nome')}
        value={values.firstName}
        onChangeText={set('firstName')}
        error={errors.firstName}
        autoComplete="given-name"
        textContentType="givenName"
      />
      <TextField
        label={t('Sobrenome')}
        value={values.lastName}
        onChangeText={set('lastName')}
        error={errors.lastName}
        autoComplete="family-name"
        textContentType="familyName"
      />
      <TextField
        label={t('E-mail')}
        value={values.email}
        onChangeText={set('email')}
        error={errors.email}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
      />
      <TextField
        label={t('Celular')}
        value={values.phone}
        onChangeText={(value) => set('phone')(formatPhone(value))}
        error={errors.phone}
        keyboardType="phone-pad"
        autoComplete="tel"
        textContentType="telephoneNumber"
      />
      <TextField
        label="CPF"
        value={values.cpf}
        onChangeText={(value) => set('cpf')(formatCpf(value))}
        error={errors.cpf}
        keyboardType="number-pad"
      />
      <TextField
        label={t('Endereço')}
        value={address}
        onChangeText={(value) => {
          setAddress(value);
          setAddressError('');
        }}
        error={addressError}
        placeholder={t('Rua, número, bairro e cidade')}
        autoComplete="street-address"
        textContentType="fullStreetAddress"
      />
      <TextField
        label={t('Senha')}
        value={values.password}
        onChangeText={set('password')}
        error={errors.password}
        secret
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
      />
      {!errors.password ? <Text style={styles.hint}>{PASSWORD_RULE}</Text> : null}
      {formError ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {formError}
        </Text>
      ) : null}

      <Button label={t('Criar conta')} onPress={() => void submit()} loading={submitting} />

      <Text style={styles.legal}>
        {t('Ao criar a conta você concorda com os')}{' '}
        <Link href={'/termos' as never} style={styles.linkInline}>
          {t('Termos de Uso')}
        </Link>{' '}
        {t('e a')}{' '}
        <Link href={'/privacidade' as never} style={styles.linkInline}>
          {t('Política de Privacidade')}
        </Link>
        .
      </Text>

      <View style={styles.switch}>
        <Text style={{ color: theme.muted }}>{t('Já tem uma conta?')} </Text>
        <Link href={PATHS.login as never} accessibilityRole="link" style={styles.linkInline}>
          {t('Entrar')}
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '700' },
  hint: { color: fixed.gray, fontSize: 13, marginTop: -8 },
  error: { color: fixed.dangerStrong },
  legal: { color: fixed.gray, fontSize: 13, textAlign: 'center' },
  linkInline: { color: fixed.accentText, fontWeight: '600' },
  switch: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap' },
});
