import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Easing, LayoutAnimation, Pressable, StyleSheet, View } from 'react-native';
import { isOpen } from '../../shared/domain';
import { t } from '../i18n';
import { Booking } from '../models/booking';
import { Professional } from '../models/professional';
import { fixed, radius } from '../theme/colors';
import { useTheme } from '../theme/theme';
import { localizeAddress } from '../utils/address';
import { bookingAddress, bookingDateLabel, isAtHome, statusLabel } from '../utils/booking-labels';
import { catalogLabel } from '../utils/catalog';
import { formatClock } from '../utils/format-date';
import { formatPrice } from '../utils/money';
import { PATHS } from '../utils/paths';
import { CardSurface } from './card-surface';
import { Text } from './text';

type Props = {
  booking: Booking;
  professional: Professional | undefined;
  onCancel: (booking: Booking) => void;
  onCopyAddress: (address: string) => void;
};

// The colors of the status pill: pending in yellow, refused and cancelled in red, the rest in the color of the theme
const statusColors = (booking: Booking, primary: string, primaryLight: string) =>
  booking.status === 'pending'
    ? { backgroundColor: fixed.warningBg, color: fixed.warning }
    : booking.status === 'declined' ||
        booking.status === 'cancelled' ||
        booking.status === 'cancelledByProfessional'
      ? { backgroundColor: fixed.dangerBg, color: fixed.danger }
      : { backgroundColor: primaryLight, color: primary };

// A booking of the client, like the card of the site: professional, day and time, address, status, the services
// (collapsed), the total and the actions (chat and cancel while it is open, "Avaliar" when it is done)
export function BookingCard({ booking, professional, onCancel, onCopyAddress }: Props) {
  const router = useRouter();
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  // The arrow turns while the list of services opens and closes (the card grows or shrinks with the same curve)
  const [turn] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.timing(turn, {
      toValue: open ? 1 : 0,
      duration: 250,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [open, turn]);
  const toggleServices = () => {
    LayoutAnimation.configureNext({
      duration: 250,
      create: { type: 'easeInEaseOut', property: 'opacity' },
      update: { type: 'easeInEaseOut' },
      delete: { type: 'easeInEaseOut', property: 'opacity' },
    });
    setOpen((current) => !current);
  };
  const address = bookingAddress(booking, professional);
  const pill = statusColors(booking, theme.primary, theme.primaryLight);
  const goToProfessional = () => router.push(PATHS.professional(booking.professionalId) as never);

  return (
    <CardSurface>
      <View style={styles.card}>
        <View style={styles.head}>
          <View style={styles.flex}>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={booking.professionalName}
              onPress={goToProfessional}
            >
              <Text style={styles.name}>{booking.professionalName}</Text>
            </Pressable>
            <Text style={[styles.when, { color: theme.primary }]}>
              {bookingDateLabel(booking)} · {formatClock(booking.startsAt)}
            </Text>
            {isAtHome(booking, professional) ? (
              <View style={styles.home}>
                <MaterialIcons name="home" size={18} color={fixed.gray} />
                <Text style={styles.address}>{t('Atendimento a domicílio')}</Text>
              </View>
            ) : address ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('Copiar endereço')}
                onPress={() => onCopyAddress(address)}
              >
                <Text style={styles.address}>
                  {localizeAddress(address)}{' '}
                  <MaterialIcons name="content-copy" size={16} color={theme.primary} />
                </Text>
              </Pressable>
            ) : null}
          </View>
          <Text style={[styles.status, pill]}>{statusLabel(booking.status)}</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('Serviços')}
          accessibilityState={{ expanded: open }}
          onPress={toggleServices}
          style={styles.summary}
        >
          <Text style={styles.bold}>{t('Serviços')}</Text>
          <Animated.View
            style={{
              transform: [
                {
                  rotate: turn.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }),
                },
              ],
            }}
          >
            <MaterialIcons name="keyboard-arrow-down" size={24} color={theme.text} />
          </Animated.View>
        </Pressable>
        {open ? (
          <View style={styles.services}>
            {booking.services.map((service) => (
              <View key={service.id} style={styles.line}>
                <Text style={styles.flex}>{catalogLabel(service.name)}</Text>
                <Text>{formatPrice(service.price)}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={[styles.line, styles.total]}>
          <Text style={styles.bold}>{t('Total')}</Text>
          <Text style={styles.bold}>{formatPrice(booking.total)}</Text>
        </View>

        {isOpen(booking.status) ? (
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('Conversar com {{name}}', { name: booking.professionalName })}
              onPress={() => router.push(`/mensagens/${booking.professionalId}` as never)}
              style={[styles.round, { backgroundColor: theme.primaryLight }]}
            >
              <MaterialIcons name="chat-bubble" size={22} color={theme.primary} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('Cancelar agendamento')}
              onPress={() => onCancel(booking)}
              style={[styles.round, styles.cancel]}
            >
              <MaterialIcons name="close" size={22} color={fixed.danger} />
            </Pressable>
          </View>
        ) : booking.status === 'completed' ? (
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('Avaliar')}
              onPress={goToProfessional}
              style={[styles.rate, { borderColor: theme.primary }]}
            >
              <Text style={[styles.rateText, { color: theme.primary }]}>{t('Avaliar')}</Text>
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
  home: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  address: { color: fixed.gray, fontSize: 14, marginTop: 4 },
  status: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    overflow: 'hidden',
    fontSize: 13,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingBottom: 12,
  },
  bold: { fontWeight: '700', color: fixed.ink },
  services: { gap: 6, paddingBottom: 12 },
  line: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  total: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: fixed.border,
    borderStyle: 'dashed',
  },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, paddingTop: 16 },
  round: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancel: { borderWidth: 1.5, borderColor: fixed.danger, backgroundColor: fixed.white },
  rate: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rateText: { fontSize: 16 },
});
