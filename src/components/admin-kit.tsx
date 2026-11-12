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

// A card of the dashboard with a number: an icon, the number, what it counts and a note. It is a button when it goes to
// a screen; `attention` paints it yellow (someone is waiting for an answer).
export function StatCard({
  icon,
  value,
  label,
  note,
  attention,
  onPress,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  value: number | null;
  label: string;
  note?: string;
  attention?: boolean;
  onPress?: () => void;
}) {
  const theme = useTheme();
  const color = attention ? fixed.warning : theme.text;
  const body = (
    <CardSurface>
      <View
        style={[
          styles.stat,
          attention && { backgroundColor: fixed.warningBg, borderRadius: radius.card },
        ]}
      >
        <View
          style={[styles.icon, { backgroundColor: attention ? fixed.white : theme.primaryLight }]}
        >
          <MaterialIcons name={icon} size={22} color={attention ? fixed.warning : theme.primary} />
        </View>
        <Text style={[styles.number, { color }]}>{value ?? '–'}</Text>
        <Text style={[styles.statLabel, { color }]}>{label}</Text>
        {note ? (
          <Text style={{ color: attention ? fixed.warning : theme.muted }}>{note}</Text>
        ) : null}
      </View>
    </CardSurface>
  );
  return onPress ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={styles.half}
    >
      {body}
    </Pressable>
  ) : (
    <View style={styles.half}>{body}</View>
  );
}

// A card that goes to another screen of the admin
export function ShortcutCard({
  icon,
  title,
  text,
  danger,
  onPress,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  text: string;
  danger?: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable accessibilityRole="link" accessibilityLabel={title} onPress={onPress}>
      <CardSurface>
        <View style={styles.shortcut}>
          <View
            style={[styles.icon, { backgroundColor: danger ? fixed.dangerBg : theme.primaryLight }]}
          >
            <MaterialIcons name={icon} size={22} color={danger ? fixed.danger : theme.primary} />
          </View>
          <View style={styles.flex}>
            <Text style={[styles.statLabel, { color: theme.text }]}>{title}</Text>
            <Text style={{ color: theme.muted }}>{text}</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={theme.muted} />
        </View>
      </CardSurface>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  stat: { padding: 16, gap: 2 },
  half: { width: '48%', flexGrow: 1 },
  number: { fontSize: 30, fontWeight: '700', marginTop: 8 },
  statLabel: { fontSize: 16, fontWeight: '600' },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  shortcut: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  flex: { flex: 1, gap: 2 },
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
