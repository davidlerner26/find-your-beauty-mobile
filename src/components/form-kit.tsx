import { MaterialIcons } from '@expo/vector-icons';
import { ReactNode, useState } from 'react';
import { StyleSheet, TextInputProps, View } from 'react-native';
import { fixed } from '../theme/colors';
import { useTheme } from '../theme/theme';
import { Text, TextInput } from './text';

type Props = TextInputProps & {
  label: string;
  // Shown under the field
  error?: string;
  // An icon inside the field, on the left (the phone)
  icon?: keyof typeof MaterialIcons.glyphMap;
};

// A field of the forms of the site: the label on top, a light rounded field with no border that gets one (and turns
// white) when it has the focus. The letters are dark in both themes: the field is light in both.
export function FormField({ label, error, icon, multiline, style, ...input }: Props) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      <View style={styles.box}>
        {icon ? (
          <MaterialIcons
            name={icon}
            size={20}
            color={focused ? fixed.brand : fixed.gray}
            style={styles.icon}
          />
        ) : null}
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor={fixed.gray}
          multiline={multiline}
          onFocus={(event) => {
            setFocused(true);
            input.onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            input.onBlur?.(event);
          }}
          {...input}
          style={[
            styles.input,
            { backgroundColor: focused ? fixed.white : theme.field },
            focused && { borderColor: fixed.brand },
            icon ? styles.withIcon : null,
            multiline ? styles.multiline : null,
            style,
          ]}
        />
      </View>
      {error ? (
        <Text accessibilityRole="alert" style={{ color: theme.errorFg }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

// A section of the form: a title and its content, with room above
export function FormSection({
  title,
  right,
  children,
}: {
  title: string;
  right?: ReactNode;
  children: ReactNode;
}) {
  const theme = useTheme();
  return (
    <View style={styles.section}>
      <View style={styles.head}>
        <Text accessibilityRole="header" style={[styles.heading, { color: theme.text }]}>
          {title}
        </Text>
        {right}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontWeight: '600' },
  box: { justifyContent: 'center' },
  input: {
    minHeight: 52,
    paddingHorizontal: 18,
    borderWidth: 1.5,
    borderColor: 'transparent',
    borderRadius: 14,
    fontSize: 16,
    color: fixed.ink,
  },
  withIcon: { paddingLeft: 48 },
  icon: { position: 'absolute', left: 16, zIndex: 1 },
  multiline: { minHeight: 128, textAlignVertical: 'top', paddingTop: 14 },
  section: { gap: 16, marginTop: 12 },
  head: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  heading: { fontSize: 18, fontWeight: '700' },
});
