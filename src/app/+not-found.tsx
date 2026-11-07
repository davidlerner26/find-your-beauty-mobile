import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Button } from '../components/button';
import { Screen } from '../components/screen';
import { Text } from '../components/text';
import { t } from '../i18n';
import { useTheme } from '../theme/theme';
import { PATHS } from '../utils/paths';

// An address that does not exist: the title, a line of explanation and a button to the start (like the site)
export default function NotFound() {
  const router = useRouter();
  const theme = useTheme();
  return (
    <Screen center>
      <View style={styles.column}>
        <Text accessibilityRole="header" style={[styles.title, { color: theme.text }]}>
          {t('Página não encontrada')}
        </Text>
        <Text style={[styles.text, { color: theme.muted }]}>
          {t('O endereço não existe ou foi movido.')}
        </Text>
        <View style={styles.button}>
          <Button
            label={t('Voltar para o início')}
            onPress={() => router.replace(PATHS.home as never)}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  column: { width: '100%', maxWidth: 448, alignSelf: 'center', gap: 16, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '700', textAlign: 'center' },
  text: { fontSize: 16, textAlign: 'center' },
  button: { alignSelf: 'stretch', marginTop: 8 },
});
