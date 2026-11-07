import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { t } from '../i18n';
import { fixed } from '../theme/colors';
import { PATHS } from '../utils/paths';
import { Button } from './button';
import { Text } from './text';

// What a screen of the account shows to a visitor: a message and the button to sign in (the same one of the site)
export function Visitor({ title, message }: { title?: string; message: string }) {
  const router = useRouter();
  return (
    <View style={styles.wrap}>
      {title ? (
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
      ) : null}
      <Text style={styles.message}>{message}</Text>
      <View style={styles.button}>
        <Button label={t('Entrar')} onPress={() => router.push(PATHS.login as never)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 8, paddingVertical: 40 },
  title: { fontSize: 19, fontWeight: '700', color: fixed.ink, textAlign: 'center' },
  message: { color: fixed.gray, textAlign: 'center', fontSize: 16 },
  button: { width: '100%', marginTop: 8 },
});
