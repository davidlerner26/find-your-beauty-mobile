import { Tabs } from 'expo-router';
import { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { fixed } from '../theme/colors';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

// The color of the icons that are not selected (`--tabbar-fg` of the site)
const INACTIVE = '#aab2c0';
const HEIGHT = 80;

// The bottom bar of the site: only icons, the selected one in the blue of the brand with a dot under it, and a
// dot of the accent color on what has news.
export function TabBar({ state, descriptors, navigateToTab, insets }: TabBarProps) {
  const { bottom } = insets;

  return (
    <View>
      <View style={[styles.bar, { height: HEIGHT + bottom, paddingBottom: bottom }]}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          const color = focused ? fixed.brand : INACTIVE;
          const badge = options.tabBarBadge;

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityLabel={options.title ?? route.name}
              accessibilityState={{ selected: focused }}
              onPress={() => !focused && navigateToTab(route.key)}
              style={styles.tab}
            >
              <View style={styles.icon}>
                {options.tabBarIcon?.({ focused, color, size: 28 })}
                {badge ? <View style={styles.badge} /> : null}
              </View>
              <View style={[styles.dot, focused && { backgroundColor: fixed.brand }]} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: fixed.white,
    shadowColor: fixed.ink,
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -6 },
    elevation: 12,
  },
  tab: { flex: 1, alignItems: 'center', gap: 6 },
  icon: { width: 28, height: 28 },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: fixed.accent,
    borderWidth: 2,
    borderColor: fixed.white,
  },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: 'transparent' },
});
