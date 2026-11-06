import { Link } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { Button } from '../../components/button';
import { Screen } from '../../components/screen';
import { useAuth, useAuthActions } from '../../contexts/auth';
import { t } from '../../i18n';
import { fixed } from '../../theme/colors';
import { PATHS } from '../../utils/paths';

// Phase 3 brings the profile data here (name, phone, CPF, address); for now it is the account and the way out
export default function Profile() {
  const auth = useAuth();
  const { signOut } = useAuthActions();

  return (
    <Screen edges={['top']}>
      <Text accessibilityRole="header" style={styles.title}>
        {t('Perfil')}
      </Text>
      {auth.user ? (
        <>
          <Text style={styles.name}>{auth.user.displayName}</Text>
          <Text style={styles.muted}>{auth.user.email}</Text>
          <Button variant="outline" label={t('Sair')} onPress={() => void signOut()} />
        </>
      ) : (
        <>
          <Text style={styles.muted}>{t('Entre na sua conta para ver o seu perfil.')}</Text>
          <Link href={PATHS.login as never} accessibilityRole="link" style={styles.link}>
            {t('Entrar')}
          </Link>
          <Link href={PATHS.signup as never} accessibilityRole="link" style={styles.link}>
            {t('Cadastre-se')}
          </Link>
          <Link href={'/privacidade' as never} accessibilityRole="link" style={styles.muted}>
            {t('Política de Privacidade')}
          </Link>
          <Link href={'/termos' as never} accessibilityRole="link" style={styles.muted}>
            {t('Termos de Uso')}
          </Link>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: '700', color: fixed.ink },
  name: { fontSize: 18, fontWeight: '600', color: fixed.ink },
  muted: { color: fixed.gray },
  link: { color: fixed.accentText, fontWeight: '600', paddingVertical: 8 },
});
