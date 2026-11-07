import { Pressable, StyleSheet } from 'react-native';
import { Text } from './text';
import { fixed, radius } from '../theme/colors';
import { useTheme } from '../theme/theme';

export function Chip({
  label,
  active,
  large,
  onPress,
}: {
  label: string;
  active?: boolean;
  // The big chips of "Categorias" on the home: selected is the light color of the theme, like the site
  large?: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!active }}
      onPress={onPress}
      style={[
        styles.chip,
        large && styles.large,
        active && large
          ? { backgroundColor: theme.primaryLight, borderColor: theme.primary }
          : active
            ? { backgroundColor: theme.primary, borderColor: theme.primary }
            : { backgroundColor: fixed.white, borderColor: fixed.border },
      ]}
    >
      <Text
        style={{
          color: active ? (large ? theme.primary : theme.onPrimary) : fixed.ink,
          fontWeight: '500',
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 16,
    minHeight: 40,
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  large: { paddingHorizontal: 32, minHeight: 56 },
});
