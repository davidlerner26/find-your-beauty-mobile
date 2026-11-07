import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { radius } from '../theme/colors';
import { useTheme } from '../theme/theme';

// The card with the shadow of the site (--shadow-card). The shadow is on the outer view and the rounded clip on the
// inner one: with `overflow: hidden` on the same view, iOS cuts the shadow off.
export function CardSurface({ children }: { children: ReactNode }) {
  const theme = useTheme();
  // The professional area has translucent cards with a border and no shadow
  const look =
    theme.name === 'pro'
      ? { backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.cardBorder }
      : { backgroundColor: theme.cardBg, ...styles.shadowed };
  return (
    <View style={[styles.card, look]}>
      <View style={styles.clip}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.card },
  shadowed: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  clip: { flexDirection: 'row', borderRadius: radius.card, overflow: 'hidden' },
});
