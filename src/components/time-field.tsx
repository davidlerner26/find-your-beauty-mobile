import { MaterialIcons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { fixed } from '../theme/colors';
import { TextInput } from './text';

// "0930" -> "09:30" while typing (the field takes digits only)
export const maskTime = (text: string) => {
  const digits = text.replace(/\D/g, '').slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits;
};

// A time typed as digits ("1830" -> "18:30"), with a clock on the right like the time field of the site. It is a
// white field in both themes.
export function TimeField({
  label,
  value,
  disabled = false,
  onChange,
}: {
  label: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.box}>
      <TextInput
        accessibilityLabel={label}
        editable={!disabled}
        value={value}
        onChangeText={(text) => onChange(maskTime(text))}
        placeholder="--:--"
        keyboardType="number-pad"
        maxLength={5}
        style={[styles.input, disabled && styles.off]}
      />
      <MaterialIcons name="schedule" size={18} color={fixed.ink} style={styles.clock} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flex: 1, justifyContent: 'center' },
  input: {
    minHeight: 44,
    paddingLeft: 12,
    paddingRight: 32,
    borderWidth: 1.5,
    borderColor: 'transparent',
    borderRadius: 14,
    backgroundColor: fixed.white,
    fontSize: 16,
    color: fixed.ink,
  },
  off: { opacity: 0.5 },
  clock: { position: 'absolute', right: 10 },
});
