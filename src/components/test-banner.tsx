import { StyleSheet } from 'react-native';
import { environment } from '../config/environment';
import { t } from '../i18n';
import { fixed } from '../theme/colors';
import { Text } from './text';

// "Ambiente de teste": a low tag stuck to the top edge of every screen, in the middle: it sits above the Dynamic
// Island (what is behind the island is not seen, so the tag is only as tall as the strip above it). Only in the
// test environment; touches go through it.
export function TestBanner() {
  if (environment.name !== 'dev') return null;

  return (
    <Text style={styles.banner} pointerEvents="none">
      {t('Ambiente de teste')}
    </Text>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    alignSelf: 'center',
    height: 14,
    paddingHorizontal: 12,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    backgroundColor: '#ee8b2e',
    color: fixed.white,
    fontSize: 9,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    overflow: 'hidden',
    zIndex: 100,
  },
});
