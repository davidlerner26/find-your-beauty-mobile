import { MaterialIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';
import { useFavorites } from '../contexts/favorites';
import { t } from '../i18n';
import { fixed } from '../theme/colors';

// The heart on the photo of a professional. Visitors do not see it: favorites belong to an account.
export function HeartButton({ professionalId }: { professionalId: string }) {
  const favorites = useFavorites();
  if (!favorites.available) return null;
  const on = favorites.has(professionalId);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={on ? t('Remover dos favoritos') : t('Favoritar')}
      accessibilityState={{ selected: on }}
      onPress={() => void favorites.toggle(professionalId)}
      hitSlop={6}
      style={styles.heart}
    >
      <MaterialIcons
        name={on ? 'favorite' : 'favorite-border'}
        size={22}
        color={on ? fixed.danger : fixed.ink}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  heart: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: fixed.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
