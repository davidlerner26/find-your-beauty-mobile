import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';
import { t } from '../i18n';
import { PATHS } from '../utils/paths';
import { useTheme } from '../theme/theme';

// Goes back, or to the start when there is nowhere to go back to (a screen opened from a link)
export function BackButton() {
  const router = useRouter();
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('Voltar')}
      hitSlop={8}
      onPress={() => (router.canGoBack() ? router.back() : router.replace(PATHS.home as never))}
      style={styles.button}
    >
      <MaterialIcons name="arrow-back" size={24} color={theme.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
});
