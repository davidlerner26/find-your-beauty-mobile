import { MaterialIcons } from '@expo/vector-icons';
import { Pressable, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { useFavorites } from '../contexts/favorites';
import { t } from '../i18n';
import { fixed } from '../theme/colors';

// The heart on the photo of a professional. Visitors do not see it: favorites belong to an account.
export function HeartButton({
  professionalId,
  large,
  style,
}: {
  professionalId: string;
  // The big round button of the top of the page of the professional
  large?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
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
      style={[styles.heart, large && styles.large, style]}
    >
      <MaterialIcons
        name={on ? 'favorite' : 'favorite-border'}
        size={large ? 26 : 22}
        color={on ? fixed.danger : fixed.ink}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  large: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.85)' },
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
