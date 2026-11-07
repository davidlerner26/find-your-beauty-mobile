import { MaterialIcons } from '@expo/vector-icons';
import { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { fixed, radius } from '../theme/colors';
import { useTheme } from '../theme/theme';
import { BackButton } from './back-button';
import { CardSurface } from './card-surface';
import { Text } from './text';

// The top of the screens of the admin: the back button and the title on its side (like the site)
export function AdminTop({ title }: { title: string }) {
  const theme = useTheme();
  return (
    <View style={styles.top}>
      <BackButton />
      <Text accessibilityRole="header" style={[styles.topTitle, { color: theme.text }]}>
        {title}
      </Text>
    </View>
  );
}

// A card of the admin: the shadow of the cards of the site and room inside
export function AdminCard({ children }: { children: ReactNode }) {
  return (
    <CardSurface>
      <View style={styles.cardBody}>{children}</View>
    </CardSurface>
  );
}

// "Aprovar" (solid) and "Negar" (red outline): rounded buttons, with an icon when they are small
export function AnswerButton({
  kind,
  label,
  onPress,
  disabled,
  icon,
  grow,
}: {
  kind: 'approve' | 'deny';
  label: string;
  onPress: () => void;
  disabled?: boolean;
  // Shows the check or the cross before the text
  icon?: boolean;
  // Takes the free space of the row (the buttons side by side on the page of a professional)
  grow?: boolean;
}) {
  const theme = useTheme();
  const approve = kind === 'approve';
  const color = approve ? theme.onPrimary : fixed.dangerStrong;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.answer,
        approve
          ? { backgroundColor: theme.primary }
          : { backgroundColor: fixed.white, borderColor: fixed.dangerStrong, borderWidth: 1.5 },
        grow && styles.grow,
        disabled && styles.off,
      ]}
    >
      {icon ? <MaterialIcons name={approve ? 'check' : 'close'} size={20} color={color} /> : null}
      <Text style={[styles.answerLabel, { color }]}>{label}</Text>
    </Pressable>
  );
}

// The state of a sign up: waiting (yellow), denied (red) or approved (the light color of the theme)
export function StatusPill({
  status,
  label,
}: {
  status: 'waiting' | 'denied' | 'approved';
  label: string;
}) {
  const theme = useTheme();
  const look =
    status === 'waiting'
      ? { backgroundColor: fixed.warningBg, color: fixed.warning }
      : status === 'denied'
        ? { backgroundColor: fixed.dangerBg, color: fixed.danger }
        : { backgroundColor: theme.primaryLight, color: theme.primary };
  return <Text style={[styles.pill, look]}>{label}</Text>;
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingTop: 8 },
  topTitle: { fontSize: 21, fontWeight: '700' },
  cardBody: { flex: 1, padding: 20, gap: 12 },
  answer: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 20,
    borderRadius: radius.pill,
  },
  answerLabel: { fontSize: 16 },
  grow: { flex: 1, minHeight: 48 },
  off: { opacity: 0.6 },
  pill: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radius.pill,
    overflow: 'hidden',
    fontSize: 13,
  },
});
