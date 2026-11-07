import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Guard } from '../../components/guard';
import { ProProfileForm } from '../../components/pro-profile-form';
import { AuthScreen } from '../../components/auth-kit';
import { Button } from '../../components/button';
import { SignupForm } from '../../components/signup-form';
import { useAuth, useAuthActions } from '../../contexts/auth';
import { t } from '../../i18n';
import { PATHS } from '../../utils/paths';

// The sign up of the professional, in two steps: the account, then the profile. When the profile is sent, the
// account waits for an admin and this screen says so.
export default function ProSignup() {
  const router = useRouter();
  const auth = useAuth();
  const { clearSignupSubmitted } = useAuthActions();

  // Leaving the "sent" message (to the login, for instance) closes it: coming back shows the form
  useEffect(() => clearSignupSubmitted, [clearSignupSubmitted]);

  if (auth.signupSubmitted) {
    return (
      <AuthScreen
        pro
        title={t('Cadastro enviado!')}
        subtitle={t(
          'Sua conta está em análise. Você poderá entrar na área do profissional assim que ela for aprovada.',
        )}
        free={false}
      >
        <Button
          label={t('Ir para o login')}
          onPress={() => router.replace(PATHS.proLogin as never)}
        />
      </AuthScreen>
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
