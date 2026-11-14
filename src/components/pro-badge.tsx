import { StyleSheet, View } from 'react-native';
import { environment } from '../config/environment';
import { t } from '../i18n';
import { fixed } from '../theme/colors';
import { Text } from './text';

// The "Pro" badge of a professional with an active subscription, beside the name. Only where the subscription exists (the
// test environment for now): in production it never shows, whatever the data.
export function ProBadge({ pro }: { pro?: boolean }) {
  if (!environment.features.proSubscription || !pro) return null;
  return (
    <View accessible accessibilityLabel={t('Assinante Pro')} style={styles.badge}>
      <Text style={styles.text}>Pro</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'center',
    paddingHorizontal: 8,
    paddingVertical: 1,
    borderRadius: 999,
    backgroundColor: fixed.accent,
  },
  text: { color: fixed.white, fontSize: 12, fontWeight: '700', lineHeight: 18 },
});
