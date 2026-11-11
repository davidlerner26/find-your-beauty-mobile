import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { AuthField, AuthScreen, FormError } from '../../../components/auth-kit';
import { Button } from '../../../components/button';
import { GoogleButton } from '../../../components/google-button';
import { Text } from '../../../components/text';
import { useAuth, useAuthActions } from '../../../contexts/auth';
import { t } from '../../../i18n';
import { InviteInfo, inviteInfo } from '../../../services/invites';
import { fixed } from '../../../theme/colors';
import { useTheme } from '../../../theme/theme';
import { inviteErrorMessage } from '../../../utils/drafts';
import { log } from '../../../utils/log';
import { PATHS } from '../../../utils/paths';
import { isValidPassword, PASSWORD_RULE } from '../../../utils/validators';

// The screen of an invite to claim a profile an admin made (findyourbeauty://convite/{draftId}/{token}; the link of the
// e-mail opens the same page on the site). The professional signs in, or creates the password, with the invited
// e-mail and claims the profile. See claimProfessionalDraft in the Cloud Functions of the site.
export default function Invite() {
  const { draftId, token } = useLocalSearchParams<{ draftId: string; token: string }>();
  const auth = useAuth();
  const [invite, setInvite] = useState<InviteInfo | null>(null);
  // The message of a link that is not valid (it comes from the server, in the language of the app)
  const [invalid, setInvalid] = useState('');

  useEffect(() => {
    if (!auth.ready) return;
    let current = true;
    inviteInfo(draftId, token)
      .then((info) => current && setInvite(info))
      .catch((failure) => {
        log.warn('Invalid invite', failure);
        if (current) setInvalid(inviteErrorMessage(failure));
      });
    return () => {
      current = false;
    };
  }, [auth.ready, draftId, token]);

  if (invalid) {
    return (
      <AuthScreen pro title={t('Convite indisponível')} subtitle={invalid} free={false}>
        <View />
      </AuthScreen>
    );
  }
  if (!invite) {
    return (
      <AuthScreen pro title={t('Convite')} subtitle="" free={false}>
        <ActivityIndicator accessibilityLabel={t('Carregando')} color={fixed.white} />
      </AuthScreen>
    );
  }
  return (
    <AuthScreen
      pro
      title={t('Olá, {{name}}', { name: invite.name })}
      subtitle={t(
        'Montamos o seu perfil no Find Your Beauty. Entre com {{email}} para assumir o perfil.',
        { email: invite.email },
      )}
      free={false}
    >
      <Claim invite={invite} draftId={draftId} token={token} />
    </AuthScreen>
  );
}

function Claim({ invite, draftId, token }: { invite: InviteInfo; draftId: string; token: string }) {
  const router = useRouter();
  const theme = useTheme();
  const auth = useAuth();
  const {
    signUpWithInvite,
    signInWithInvite,
    signInWithGoogleForInvite,
    claimProfessional,
    signOut,
  } = useAuthActions();
  const [password, setPassword] = useState('');
  // "Already have an account": signs in instead of creating the password
  const [hasAccount, setHasAccount] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');

  const signedEmail = auth.user?.email?.toLowerCase();
  const matches = !!signedEmail && signedEmail === invite.email.toLowerCase();

  const run = async (action: () => Promise<boolean | void>) => {
    setError('');
    setWorking(true);
    try {
      return await action();
    } catch (failure) {
      log.warn('Invite step failed', failure);
      setError(inviteErrorMessage(failure));
      return false;
    } finally {
      setWorking(false);
    }
  };

  const claim = async () => {
    await claimProfessional(draftId, token);
    router.replace(PATHS.proHome as never);
  };

  const submit = async () => {
    setSubmitted(true);
    if (!isValidPassword(password)) return;
    await run(async () => {
      if (hasAccount) await signInWithInvite(invite.email, password);
      else await signUpWithInvite(invite.email, password);
      await claim();
    });
  };

  // Already signed in with the invited e-mail
  if (auth.user && matches) {
    return (
      <>
        <Button
          label={working ? t('Assumindo...') : t('Assumir o meu perfil')}
          onPress={() => void run(claim)}
          loading={working}
        />
        {error ? <FormError>{error}</FormError> : null}
      </>
    );
  }

  if (auth.user) {
    return (
      <>
        <Text style={{ color: theme.text }}>
          {t(
            'Você está com outra conta aberta ({{email}}). Para assumir o perfil, use o e-mail do convite.',
            { email: auth.user.email ?? '' },
          )}
        </Text>
        <Button label={t('Sair desta conta')} onPress={() => void signOut()} />
      </>
    );
  }

  return (
    <>
      <AuthField
        icon="lock"
        placeholder={hasAccount ? t('Sua senha') : t('Crie uma senha')}
        value={password}
        onChangeText={setPassword}
        error={submitted && !isValidPassword(password) ? PASSWORD_RULE : undefined}
        secret
        autoCapitalize="none"
        autoComplete={hasAccount ? 'current-password' : 'new-password'}
        textContentType={hasAccount ? 'password' : 'newPassword'}
      />
      {error ? <FormError>{error}</FormError> : null}
      <View style={styles.submit}>
        <Button
          label={
            working
              ? t('Aguarde...')
              : hasAccount
                ? t('Entrar e assumir o perfil')
                : t('Criar senha e assumir o perfil')
          }
          onPress={() => void submit()}
          loading={working}
        />
      </View>
      <GoogleButton
        label={t('Continuar com Google')}
        run={async () => {
          const signedIn = await signInWithGoogleForInvite(invite.email);
          if (signedIn) await claim();
          return signedIn;
        }}
      />
      <Button
        variant="link"
        label={hasAccount ? t('Criar uma senha') : t('Já tenho uma conta')}
        onPress={() => setHasAccount((current) => !current)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  submit: { marginTop: 8 },
});
