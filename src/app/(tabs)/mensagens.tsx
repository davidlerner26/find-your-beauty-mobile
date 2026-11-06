import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Guard } from '../../components/guard';
import { Inbox } from '../../components/inbox';
import { useAuth } from '../../contexts/auth';
import { t } from '../../i18n';
import { fixed } from '../../theme/colors';
import { PATHS } from '../../utils/paths';

export default function MessagesScreen() {
  return (
    <Guard kind="clientArea" proPath={PATHS.proMessages}>
      <Messages />
    </Guard>
  );
}

function Messages() {
  const auth = useAuth();
  if (!auth.user) {
    return (
      <SafeAreaView edges={['top']} style={styles.screen}>
        <View style={styles.guest}>
          <Text accessibilityRole="header" style={styles.title}>
            {t('Mensagens')}
          </Text>
          <Text style={styles.bold}>{t('Você não está logado.')}</Text>
          <Text style={styles.muted}>
            {t('Entre na sua conta para conversar com os profissionais.')}
          </Text>
          <Link href={PATHS.login as never} accessibilityRole="link" style={styles.link}>
            {t('Entrar')}
          </Link>
        </View>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <Inbox />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: fixed.white },
  guest: { padding: 16, gap: 8 },
  title: { fontSize: 26, fontWeight: '700', color: fixed.ink },
  bold: { fontWeight: '700', color: fixed.ink },
  muted: { color: fixed.gray },
  link: { color: fixed.accentText, fontWeight: '600', paddingVertical: 8 },
});
