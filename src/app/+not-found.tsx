import { Link } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { Screen } from '../components/screen';
import { t } from '../i18n';
import { fixed } from '../theme/colors';
import { PATHS } from '../utils/paths';

export default function NotFound() {
  return (
    <Screen>
      <Text accessibilityRole="header" style={styles.title}>
        {t('Página não encontrada')}
      </Text>
      <Link href={PATHS.home as never} accessibilityRole="link" style={styles.link}>
        {t('Voltar para o início')}
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '700', color: fixed.ink },
  link: { color: fixed.accentText, fontWeight: '600', padding: 8 },
});
