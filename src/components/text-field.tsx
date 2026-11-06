import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { t } from '../i18n';
import { fixed } from '../theme/colors';
import { useTheme } from '../theme/theme';

type Props = Omit<TextInputProps, 'onChangeText' | 'value'> & {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  // Shown under the field in red
  error?: string;
  // A password field with the eye to show it
  secret?: boolean;
};

export function TextField({ label, value, onChangeText, error, secret, ...input }: Props) {
  const theme = useTheme();
  const [shown, setShown] = useState(false);

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      <View style={[styles.box, { borderColor: error ? fixed.danger : fixed.border }]}>
        <TextInput
          accessibilityLabel={label}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secret && !shown}
          placeholderTextColor={fixed.gray}
          style={styles.input}
          {...input}
        />
        {secret ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={shown ? t('Ocultar senha') : t('Mostrar senha')}
            onPress={() => setShown((current) => !current)}
            hitSlop={8}
          >
            <MaterialIcons
              name={shown ? 'visibility-off' : 'visibility'}
              size={22}
              color={fixed.gray}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontSize: 14, fontWeight: '600' },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: fixed.white,
  },
  input: { flex: 1, minHeight: 48, fontSize: 16, color: fixed.ink },
  error: { color: fixed.dangerStrong, fontSize: 13 },
});
