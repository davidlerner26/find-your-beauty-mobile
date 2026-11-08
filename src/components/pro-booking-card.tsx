import { MaterialIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { t } from '../i18n';
import { Booking } from '../models/booking';
import { fixed, radius } from '../theme/colors';
import { useTheme } from '../theme/theme';
import { bookingDateLabel, statusLabel } from '../utils/booking-labels';
import { catalogLabel } from '../utils/catalog';
import { formatClock } from '../utils/format-date';
import { formatPrice } from '../utils/money';
import { CardSurface } from './card-surface';
import { Text } from './text';

type Props = {
  booking: Booking;
  onAnswer: (
    booking: Booking,
    status: 'confirmed' | 'declined' | 'cancelledByProfessional',
  ) => void;
};

// A booking of the professional, like the card of the site: the client, day and time, where, status, the services,
// the total and the notes, with "Recusar" and "Aceitar" for a request and a round cancel for a confirmed booking
export function ProBookingCard({ booking, onAnswer }: Props) {
  const theme = useTheme();
  const pill =
    booking.status === 'pending'
      ? { backgroundColor: fixed.warningBg, color: fixed.warning }
      : booking.status === 'declined' ||
          booking.status === 'cancelled' ||
          booking.status === 'cancelledByProfessional'
        ? { backgroundColor: fixed.dangerBg, color: fixed.danger }
        : { backgroundColor: theme.primaryLight, color: theme.primary };

  return (
    <CardSurface>
      <View style={styles.card}>
        <View style={styles.head}>
          <View style={styles.flex}>
            <Text style={styles.name}>{booking.clientName}</Text>
            <Text style={[styles.when, { color: theme.primary }]}>
              {bookingDateLabel(booking)} · {formatClock(booking.startsAt)}
            </Text>
            {booking.place === 'home' ? (
              <View style={styles.place}>
                <MaterialIcons name="home" size={18} color={theme.muted} />
                <Text style={[styles.muted, styles.flex, { color: theme.muted }]}>
                  {t('A domicílio')}
                  {booking.clientAddress ? `: ${booking.clientAddress}` : ''}
                </Text>
              </View>
            ) : booking.place === 'studio' ? (
              <View style={styles.place}>
                <MaterialIcons name="location-on" size={18} color={theme.muted} />
                <Text style={[styles.muted, { color: theme.muted }]}>{t('No seu endereço')}</Text>
              </View>
            ) : null}
          </View>
          <Text style={[styles.status, pill]}>{statusLabel(booking.status)}</Text>
        </View>

        <View style={styles.services}>
          {booking.services.map((service) => (
            <View key={service.id} style={styles.line}>
              <Text style={[styles.flex, { color: theme.text }]}>{catalogLabel(service.name)}</Text>
              <Text style={{ color: theme.text }}>{formatPrice(service.price)}</Text>
            </View>
          ))}
        </View>
        {/* A dashed line: a box with a dashed border on every side, cut to its top edge (a border on one side is not dashed) */}
        <View style={styles.dash}>
          <View style={[styles.dashed, { borderColor: theme.lineStrong }]} />
        </View>
        <View style={[styles.line, styles.total]}>
          <Text style={[styles.bold, { color: theme.text }]}>{t('Total')}</Text>
          <Text style={[styles.bold, { color: theme.text }]}>{formatPrice(booking.total)}</Text>
        </View>

        {booking.notes ? (
          <Text style={[styles.notes, { color: theme.muted }]}>“{booking.notes}”</Text>
        ) : null}

        {booking.status === 'pending' ? (
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('Recusar')}
              onPress={() => onAnswer(booking, 'declined')}
              style={[styles.button, styles.danger]}
            >
              <Text style={[styles.buttonText, { color: fixed.danger }]}>{t('Recusar')}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('Aceitar')}
              onPress={() => onAnswer(booking, 'confirmed')}
              style={[styles.button, { backgroundColor: theme.primary }]}
            >
              <Text style={[styles.buttonText, { color: theme.onPrimary }]}>{t('Aceitar')}</Text>
            </Pressable>
          </View>
        ) : booking.status === 'confirmed' ? (
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('Cancelar agendamento')}
              onPress={() => onAnswer(booking, 'cancelledByProfessional')}
              style={[styles.round, styles.danger]}
            >
              <MaterialIcons name="close" size={22} color={fixed.danger} />
            </Pressable>
          </View>
        ) : null}
      </View>
    </CardSurface>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, padding: 20, gap: 4 },
  flex: { flex: 1 },
  head: { flexDirection: 'row', justifyContent: 'space-between', gap: 16 },
  name: { fontSize: 18, fontWeight: '700', color: fixed.ink },
  when: { marginTop: 4, textTransform: 'capitalize' },
  place: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  muted: { fontSize: 14 },
  status: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    overflow: 'hidden',
    fontSize: 13,
  },
  services: { gap: 6, marginTop: 16, marginBottom: 8 },
  line: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  bold: { fontWeight: '700', color: fixed.ink },
  dash: { height: 1, overflow: 'hidden', marginTop: 4 },
  dashed: { height: 4, borderWidth: 1, borderStyle: 'dashed' },
  total: { paddingTop: 12 },
  notes: { marginTop: 12 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 16 },
  button: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { fontSize: 16 },
  danger: { borderWidth: 1.5, borderColor: fixed.danger, backgroundColor: fixed.white },
  round: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
