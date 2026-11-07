import { Pressable, StyleSheet } from 'react-native';
import { Text } from './text';
import { fixed, radius } from '../theme/colors';
import { useTheme } from '../theme/theme';

export function Chip({
  label,
  active,
  large,
  soft,
  disabled,
  onPress,
}: {
  label: string;
  active?: boolean;
  // The big chips of "Categorias" on the home
  large?: boolean;
  // A chip without border, in the light color of the theme (the popular searches)
  soft?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  // Selected is the light color of the theme with a border and text in the main color, like the site
  const look = soft
    ? { backgroundColor: theme.primaryLight, borderColor: theme.primaryLight, color: theme.primary }
    : active
      ? { backgroundColor: theme.primaryLight, borderColor: theme.primary, color: theme.primary }
      : { backgroundColor: fixed.white, borderColor: fixed.border, color: fixed.ink };
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!active, disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.chip,
        large && styles.large,
        soft && styles.soft,
        { backgroundColor: look.backgroundColor, borderColor: look.borderColor },
        disabled && { opacity: 0.45 },
      ]}
    >
      <Text style={{ color: look.color, fontWeight: '500' }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 22,
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: 1.5,
  },
  large: { paddingHorizontal: 32, minHeight: 56 },
  soft: { paddingHorizontal: 28, minHeight: 46 },
});
