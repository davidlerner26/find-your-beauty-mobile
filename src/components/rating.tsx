import { MaterialIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { t } from '../i18n';
import { fixed } from '../theme/colors';
import { reviewsLabel } from '../utils/labels';

// "★ 4.8 (12 avaliações)"
export function Rating({ rating, count }: { rating: number; count: string | number }) {
  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={`${rating} ${t('estrelas')}, ${count} ${reviewsLabel(count)}`}
    >
      <MaterialIcons name="star" size={16} color={fixed.accent} />
      <Text style={styles.strong}>{rating}</Text>
      <Text style={styles.muted}>
        ({count} {reviewsLabel(count)})
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  strong: { fontWeight: '700', color: fixed.ink },
  muted: { color: fixed.gray },
});
