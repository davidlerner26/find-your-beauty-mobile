import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { fixed } from '../theme/colors';
import { BackButton } from './back-button';
import { Text } from './text';

// The bar on top of the inner screens of the site: back button, the title in the middle and a line below. `right` is
// what goes on the other side (the filters of the search).
export function TopBar({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <View style={styles.top}>
      <BackButton />
      <Text accessibilityRole="header" style={styles.title} pointerEvents="none">
        {title}
      </Text>
      {right ?? <View style={styles.space} />}
    </View>
  );
}

const styles = StyleSheet.create({
  top: {
    height: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: fixed.divider,
  },
  title: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: fixed.ink,
  },
  space: { width: 40, height: 40 },
});
