import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { environment } from '../config/environment';
import { t } from '../i18n';
import { fixed } from '../theme/colors';
import { Text } from './text';

// "Ambiente de teste": a tag in the middle of the top of every screen, just below the status bar. Only in the
// test environment; touches go through it.
export function TestBanner() {
  const { top } = useSafeAreaInsets();
  if (environment.name !== 'dev') return null;

  return (
    <Text style={[styles.banner, { top }]} pointerEvents="none">
      {t('Ambiente de teste')}
    </Text>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    alignSelf: 'center',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    backgroundColor: '#ee8b2e',
    color: fixed.white,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    overflow: 'hidden',
    zIndex: 100,
  },
});
