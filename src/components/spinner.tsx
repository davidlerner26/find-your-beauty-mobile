import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { t } from '../i18n';
import { fixed } from '../theme/colors';

export function Spinner({ small }: { small?: boolean }) {
  return (
    <View style={small ? undefined : styles.center}>
      <ActivityIndicator
        accessibilityLabel={t('Carregando')}
        size={small ? 'small' : 'large'}
        color={fixed.brand}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
});
