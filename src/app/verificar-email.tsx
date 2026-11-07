import { Redirect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, TextInput } from '../components/text';
import { BackButton } from '../components/back-button';
import { Button } from '../components/button';
import { Screen } from '../components/screen';
import { useAuth, useAuthActions } from '../contexts/auth';
import { t } from '../i18n';
import { fixed } from '../theme/colors';
import { useTheme } from '../theme/theme';
import { cleanCode, clock, CODE_LENGTH } from '../utils/auth-forms';
import { PATHS } from '../utils/paths';

const RESEND_SECONDS = 60;

// Confirms the e-mail of a new client with the 4 digit code that was sent to it, then signs the client in
export default function VerifyEmail() {
  const router = useRouter();
  const theme = useTheme();
  const auth = useAuth();
  const { verifyEmail, sendVerificationCode } = useAuthActions();
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  // Seconds until another code can be asked for (the one just sent counts)
  const [wait, setWait] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (wait <= 0) return;
    const timer = setTimeout(() => setWait((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);

  const email = auth.verification?.email ?? '';

  const submit = useCallback(
    async (typed: string) => {
      if (typed.length !== CODE_LENGTH || submitting) return;
      setError('');
      setSubmitting(true);
      try {
        const signedIn = await verifyEmail(typed);
        // Without the password (the app was restarted), the client signs in by hand
        router.replace((signedIn ? PATHS.home : PATHS.login) as never);
      } catch (failure) {
        setError(
          (failure as { message?: string }).message || t('Não foi possível verificar o código.'),
        );
        setCode('');
      } finally {
        setSubmitting(false);
      }
    },
    [submitting, verifyEmail, router],
  );

  const resend = async () => {
    if (wait > 0) return;
    setError('');
    setNotice('');
    try {
      await sendVerificationCode(email);
      setNotice(t('Enviamos um novo código.'));
      setWait(RESEND_SECONDS);
    } catch (failure) {
      setError((failure as { message?: string }).message || t('Não foi possível enviar o código.'));
    }
  };

  if (auth.ready && !auth.verification) return <Redirect href={PATHS.login as never} />;

  return (
    <Screen>
      <BackButton />
      <Text accessibilityRole="header" style={[styles.title, { color: theme.text }]}>
        {t('Confirme o seu e-mail')}
      </Text>
      <Text style={{ color: theme.muted }}>
        {t('Enviamos um código de 4 dígitos para {{email}}.', { email })}
      </Text>

      <TextInput
        accessibilityLabel={t('Código de 4 dígitos')}
        value={code}
        onChangeText={(text) => {
          const next = cleanCode(text);
          setCode(next);
          setError('');
          void submit(next);
        }}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        maxLength={CODE_LENGTH}
        autoFocus
        style={styles.code}
      />
      <View style={styles.boxes} accessibilityElementsHidden importantForAccessibility="no">
        {Array.from({ length: CODE_LENGTH }, (_, i) => (
          <View key={i} style={[styles.box, i === code.length && styles.boxCurrent]}>
            <Text style={styles.digit}>{code[i] ?? ''}</Text>
          </View>
        ))}
      </View>

      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
      {notice ? <Text style={styles.notice}>{notice}</Text> : null}

      <Button
        label={t('Confirmar')}
        onPress={() => void submit(code)}
        loading={submitting}
        disabled={code.length !== CODE_LENGTH}
      />
      <Button
        variant="link"
        label={
          wait > 0 ? t('Reenviar código em {{time}}', { time: clock(wait) }) : t('Reenviar código')
        }
        onPress={() => void resend()}
        disabled={wait > 0}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '700' },
  // The real input covers the boxes: the boxes only draw what was typed
  code: { position: 'absolute', opacity: 0, height: 1, width: 1 },
  boxes: { flexDirection: 'row', justifyContent: 'center', gap: 12 },
  box: {
    width: 56,
    height: 64,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: fixed.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxCurrent: { borderColor: fixed.brand },
  digit: { fontSize: 28, fontWeight: '700', color: fixed.ink },
  error: { color: fixed.dangerStrong, textAlign: 'center' },
  notice: { color: fixed.success, textAlign: 'center' },
});
