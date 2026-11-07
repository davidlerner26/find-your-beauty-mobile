import { Pressable, StyleSheet } from 'react-native';
import { Text } from './text';
import { fixed, radius } from '../theme/colors';
import { useTheme } from '../theme/theme';

export function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
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
        active
          ? { backgroundColor: theme.primary, borderColor: theme.primary }
          : { backgroundColor: fixed.white, borderColor: fixed.border },
      ]}
    >
      <Text style={{ color: active ? theme.onPrimary : fixed.ink, fontWeight: '500' }}>
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
});
