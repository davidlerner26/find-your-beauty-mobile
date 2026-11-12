import { Redirect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, TextInput } from '../components/text';
import { Button } from '../components/button';
import { Link } from '../components/link';
import { Screen } from '../components/screen';
import { useAuth, useAuthActions } from '../contexts/auth';
import { t } from '../i18n';
import { fixed } from '../theme/colors';
import { useTheme } from '../theme/theme';
import { cleanCode, clock, CODE_LENGTH } from '../utils/auth-forms';
import { PATHS } from '../utils/paths';
import { Guard } from '../components/guard';

const RESEND_SECONDS = 60;

// Confirms the e-mail of a new client with the 4 digit code that was sent to it, then signs the client in
function VerifyEmailContent() {
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
    <Screen center>
      <View style={styles.column}>
        <Text accessibilityRole="header" style={[styles.title, { color: theme.text }]}>
          {t('Confirme o seu e-mail')}
        </Text>
        <Text style={[styles.subtitle, { color: theme.muted }]}>
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
            <View
              key={i}
              style={[
                styles.box,
                i === code.length && { borderColor: theme.primary, backgroundColor: fixed.white },
              ]}
            >
              <Text style={[styles.digit, { color: theme.text }]}>{code[i] ?? ''}</Text>
            </View>
          ))}
        </View>

        {error ? (
          <Text accessibilityRole="alert" style={{ color: theme.errorFg }}>
            {error}
          </Text>
        ) : null}
        {notice ? <Text style={styles.notice}>{notice}</Text> : null}

        <View style={styles.resend}>
          <Button
            variant="link"
            label={
              wait > 0
                ? t('Reenviar código em {{time}}', { time: clock(wait) })
                : t('Reenviar código')
            }
            onPress={() => void resend()}
            disabled={wait > 0}
          />
        </View>

        <View style={styles.submit}>
          <Button
            label={t('Confirmar')}
            onPress={() => void submit(code)}
            loading={submitting}
            disabled={code.length !== CODE_LENGTH}
          />
        </View>

        <Link
          href={PATHS.login as never}
          accessibilityRole="link"
          style={[styles.back, { color: theme.primary }]}
        >
          {t('Voltar ao login')}
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  column: { width: '100%', maxWidth: 416, alignSelf: 'center', gap: 16 },
  title: { fontSize: 28, fontWeight: '700' },
  subtitle: { marginBottom: 8, fontSize: 16 },
  // The real input covers the boxes: the boxes only draw what was typed
  code: { position: 'absolute', opacity: 0, height: 1, width: 1 },
  boxes: { flexDirection: 'row', gap: 12, marginTop: 8 },
  box: {
    flex: 1,
    height: 72,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: fixed.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  digit: { fontSize: 28, fontWeight: '700' },
  notice: { color: fixed.success },
  resend: { alignItems: 'flex-end' },
  submit: { marginTop: 8 },
  back: { textAlign: 'center', fontWeight: '600', padding: 8 },
});

// Closed to a signed in professional: she has her own area
export default function VerifyEmail() {
  return (
    <Guard kind="clientArea">
      <VerifyEmailContent />
    </Guard>
  );
}
