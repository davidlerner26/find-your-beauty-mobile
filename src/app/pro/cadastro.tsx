import { Link } from '../../components/link';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Text } from '../../components/text';
import { Guard } from '../../components/guard';
import { ProProfileForm } from '../../components/pro-profile-form';
import { Screen } from '../../components/screen';
import { SignupForm } from '../../components/signup-form';
import { useAuth, useAuthActions } from '../../contexts/auth';
import { t } from '../../i18n';
import { fixed } from '../../theme/colors';
import { PATHS } from '../../utils/paths';

// The sign up of the professional, in two steps: the account, then the profile. When the profile is sent, the
// account waits for an admin and this screen says so.
export default function ProSignup() {
  const auth = useAuth();
  const { clearSignupSubmitted } = useAuthActions();

  // Leaving the "sent" message (to the login, for instance) closes it: coming back shows the form
  useEffect(() => clearSignupSubmitted, [clearSignupSubmitted]);

  if (auth.signupSubmitted) {
    return (
      <Screen>
        <Text accessibilityRole="header" style={styles.title}>
          {t('Cadastro enviado!')}
        </Text>
        <Text style={styles.muted}>
          {t(
            'Sua conta está em análise. Você poderá entrar na área do profissional assim que ela for aprovada.',
          )}
        </Text>
        <Link href={PATHS.proLogin as never} accessibilityRole="link" style={styles.link}>
          {t('Ir para o login')}
        </Link>
      </Screen>
    );
  }

  // The account was created: the second step completes the profile
  if (auth.signupIncomplete) {
    return (
      <Guard kind="proEntry">
        <ProProfileForm signup />
      </Guard>
    );
  }
  return <SignupForm pro />;
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '700', color: fixed.ink },
  muted: { color: fixed.gray, fontSize: 16 },
  link: { color: fixed.accentText, fontWeight: '600', paddingVertical: 8 },
});
