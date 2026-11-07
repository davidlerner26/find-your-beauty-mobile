import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { fixed, radius } from '../theme/colors';

// The card with the shadow of the site (--shadow-card). The shadow is on the outer view and the rounded clip on the
// inner one: with `overflow: hidden` on the same view, iOS cuts the shadow off.
export function CardSurface({ children }: { children: ReactNode }) {
  return (
    <View style={styles.shadow}>
      <View style={styles.clip}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    borderRadius: radius.card,
    backgroundColor: fixed.white,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  clip: { flexDirection: 'row', borderRadius: radius.card, overflow: 'hidden' },
});
