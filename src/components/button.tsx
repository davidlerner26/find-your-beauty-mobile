import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { Text } from './text';
import { fixed, radius } from '../theme/colors';
import { useTheme } from '../theme/theme';

type Props = {
  label: string;
  onPress: () => void;
  // 'solid' fills with the theme color, 'outline' has a border, 'light' is white with a border in the theme color and blue letters (also in the blue professional area), 'danger' is white with a red border (remove, sign out), 'link' is plain text
  variant?: 'solid' | 'outline' | 'light' | 'danger' | 'link';
  disabled?: boolean;
  loading?: boolean;
};

export function Button({ label, onPress, variant = 'solid', disabled, loading }: Props) {
  const theme = useTheme();
  const off = disabled || loading;
  const solid = variant === 'solid';
  const color = solid
    ? theme.onPrimary
    : variant === 'danger'
      ? fixed.dangerStrong
      : variant === 'light'
        ? fixed.brand
        : theme.primary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      disabled={off}
      onPress={onPress}
      style={[
        styles.base,
        solid && { backgroundColor: off ? fixed.disabled : theme.primary },
        variant === 'outline' && { borderWidth: 1.5, borderColor: theme.primary },
        variant === 'light' && {
          borderWidth: 1.5,
          borderColor: theme.primary,
          backgroundColor: fixed.white,
        },
        variant === 'danger' && {
          borderWidth: 1.5,
          borderColor: fixed.dangerStrong,
          backgroundColor: fixed.white,
        },
        variant === 'link' && styles.link,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={color} />
      ) : (
        <Text style={[styles.label, { color }, variant === 'link' && styles.linkLabel]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 56,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  link: { minHeight: 36, paddingHorizontal: 8 },
  label: { fontSize: 17, fontWeight: '600' },
  linkLabel: { fontSize: 14, fontWeight: '500' },
});
