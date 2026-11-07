import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ReactNode, useState } from 'react';
import { Pressable, StyleSheet, TextInputProps, View } from 'react-native';
import { t } from '../i18n';
import { fixed, radius } from '../theme/colors';
import { ThemeProvider, useTheme } from '../theme/theme';
import { PATHS } from '../utils/paths';
import { Screen } from './screen';
import { Text, TextInput } from './text';

type Area = 'login' | 'signup';

// The look of the sign in, sign up and password screens of the site: the form in the middle, a switch between the
// client and the professional area on top, a title, a subtitle and the "100% free" pill. The professional area is
// blue with white fields (its theme).
export function AuthScreen({
  pro = false,
  area,
  title,
  subtitle,
  free = true,
  children,
}: {
  pro?: boolean;
  // Shows the switch between the two areas, going to this screen of the other one
  area?: Area;
  title: string;
  subtitle: string;
  free?: boolean;
  children: ReactNode;
}) {
  return (
    <ThemeProvider pro={pro}>
      <StatusBar style={pro ? 'light' : 'dark'} />
      <Screen center>
        <View style={styles.column}>
          {area ? <RoleTabs pro={pro} area={area} /> : null}
          <Heading title={title} subtitle={subtitle} free={free} />
          {children}
        </View>
      </Screen>
    </ThemeProvider>
  );
}

function Heading({ title, subtitle, free }: { title: string; subtitle: string; free: boolean }) {
  const theme = useTheme();
  return (
    <View style={styles.heading}>
      <Text accessibilityRole="header" style={[styles.title, { color: theme.text }]}>
        {title}
      </Text>
      <Text style={[styles.subtitle, { color: theme.muted }]}>{subtitle}</Text>
      {free ? (
        <Text style={[styles.free, { backgroundColor: theme.primaryLight, color: theme.primary }]}>
          {'✦ '}
          {t('O Find Your Beauty é 100% gratuito.')}
        </Text>
      ) : null}
    </View>
  );
}

// Client / professional: a segmented control at the top, so the two areas are easy to tell apart
function RoleTabs({ pro, area }: { pro: boolean; area: Area }) {
  const router = useRouter();
  const theme = useTheme();
  const go = (toPro: boolean) => {
    if (toPro === pro) return;
    const paths = {
      login: [PATHS.login, PATHS.proLogin],
      signup: [PATHS.signup, PATHS.proSignup],
    }[area];
    router.replace(paths[toPro ? 1 : 0] as never);
  };

  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={t('Tipo de conta')}
      style={[styles.tabs, { backgroundColor: theme.primaryLight }]}
    >
      {[false, true].map((toPro) => {
        const active = toPro === pro;
        return (
          <Pressable
            key={String(toPro)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => go(toPro)}
            style={[styles.tab, active && { backgroundColor: theme.primary }]}
          >
            <Text style={[styles.tabText, { color: active ? theme.onPrimary : theme.primary }]}>
              {toPro ? t('Sou profissional') : t('Sou cliente')}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

type FieldProps = Omit<TextInputProps, 'onChangeText' | 'value' | 'placeholder'> & {
  placeholder: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
  // A password field with the eye to show it
  secret?: boolean;
};

// A field of the sign in and sign up screens: a pill with the icon on the left and the text inside, no label above
export function AuthField({
  placeholder,
  icon,
  value,
  onChangeText,
  error,
  secret,
  ...input
}: FieldProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const [shown, setShown] = useState(false);
  const color = focused ? fixed.brand : fixed.gray;

  return (
    <View style={styles.fieldWrap}>
      <View
        style={[
          styles.field,
          { backgroundColor: focused ? fixed.white : theme.field },
          {
            borderColor: error ? fixed.danger : focused ? theme.primary : 'transparent',
          },
        ]}
      >
        <MaterialIcons name={icon} size={20} color={color} />
        <TextInput
          accessibilityLabel={placeholder}
          placeholder={placeholder}
          placeholderTextColor={fixed.gray}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secret && !shown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
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
            <MaterialIcons name={shown ? 'visibility-off' : 'visibility'} size={20} color={color} />
          </Pressable>
        ) : null}
      </View>
      {error ? <FormError>{error}</FormError> : null}
    </View>
  );
}

// An error of the form, in the color the theme gives it
export function FormError({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return (
    <Text accessibilityRole="alert" style={[styles.error, { color: theme.errorFg }]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  column: { width: '100%', maxWidth: 416, alignSelf: 'center', gap: 16 },
  heading: { gap: 8 },
  title: { fontSize: 28, fontWeight: '700' },
  subtitle: { fontSize: 16 },
  free: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.pill,
    overflow: 'hidden',
    fontSize: 14,
    fontWeight: '600',
  },
  tabs: { flexDirection: 'row', padding: 5, borderRadius: radius.pill, marginBottom: 8 },
  tab: { flex: 1, paddingVertical: 13, borderRadius: radius.pill, alignItems: 'center' },
  tabText: { fontWeight: '600', fontSize: 16 },
  fieldWrap: { gap: 6 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 56,
    paddingHorizontal: 20,
    borderRadius: radius.pill,
    borderWidth: 1.5,
  },
  input: { flex: 1, minWidth: 0, fontSize: 16, color: fixed.ink, height: '100%' },
  error: { marginLeft: 20, fontSize: 14 },
});
