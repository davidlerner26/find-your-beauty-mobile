import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Link } from '../../components/link';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../components/text';
import { isOpen } from '../../../shared/domain';
import { Guard } from '../../components/guard';
import { Visitor } from '../../components/visitor';
import { Screen } from '../../components/screen';
import { Spinner } from '../../components/spinner';
import { useAuth } from '../../contexts/auth';
import { useBookings } from '../../contexts/bookings';
import { useProfessionals } from '../../contexts/professionals';
import { useToast } from '../../contexts/toast';
import { t } from '../../i18n';
import { Booking } from '../../models/booking';
import { cancelBooking } from '../../services/bookings';
import { fixed } from '../../theme/colors';
import {
  bookingAddress,
  bookingDateLabel,
  isAtHome,
  statusLabel,
} from '../../utils/booking-labels';
import { catalogLabel } from '../../utils/catalog';
import { formatClock } from '../../utils/format-date';
import { localizeAddress } from '../../utils/address';
import { log } from '../../utils/log';
import { formatPrice } from '../../utils/money';
import { PATHS } from '../../utils/paths';
import { upcomingAndHistory } from '../../utils/booking-lists';

export default function AgendaScreen() {
  return (
    <Guard kind="clientArea">
      <Agenda />
    </Guard>
  );
}

function Agenda() {
  const auth = useAuth();
  const { mine, mineLoading } = useBookings();
  const professionals = useProfessionals();
  const toast = useToast();

  if (auth.ready && !auth.user) {
    return (
      <Screen edges={['top']}>
        <Visitor
          title={t('Você não está logado.')}
          message={t('Entre na sua conta para ver os seus agendamentos.')}
        />
      </Screen>
    );
  }

  const { upcoming, history } = upcomingAndHistory(mine);

  const cancel = (booking: Booking) =>
    Alert.alert(
      t('Cancelar o agendamento com {{name}}?', { name: booking.professionalName }),
      undefined,
      [
        { text: t('Voltar'), style: 'cancel' },
        {
          text: t('Cancelar agendamento'),
          style: 'destructive',
          onPress: () =>
            cancelBooking(booking)
              .then(() => toast.show(t('Agendamento cancelado')))
              .catch((error) => {
                log.error('Failed to cancel booking', error);
                toast.show(t('Não foi possível cancelar. Tente novamente.'));
              }),
        },
      ],
    );

  const renderBooking = (booking: Booking) => {
    const professional = professionals.byId(booking.professionalId);
    const address = bookingAddress(booking, professional);
    return (
      <View key={booking.id} style={styles.card}>
        <View style={styles.between}>
          <Link href={PATHS.professional(booking.professionalId) as never} accessibilityRole="link">
            <Text style={styles.name}>{booking.professionalName}</Text>
          </Link>
          <Text style={[styles.status, statusStyle(booking)]}>{statusLabel(booking.status)}</Text>
        </View>
        <Text style={styles.when}>
          {bookingDateLabel(booking)} · {formatClock(booking.startsAt)}
        </Text>
        {isAtHome(booking, professional) ? (
          <Text style={styles.muted}>{t('Atendimento a domicílio')}</Text>
        ) : address ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('Copiar endereço')}
            onPress={() =>
              Clipboard.setStringAsync(address).then(() => toast.show(t('Endereço copiado'), 2000))
            }
            style={styles.address}
          >
            <Text style={[styles.muted, { flexShrink: 1 }]}>{localizeAddress(address)}</Text>
            <MaterialIcons name="content-copy" size={16} color={fixed.gray} />
          </Pressable>
        ) : null}
        {booking.services.map((service) => (
          <View key={service.id} style={styles.between}>
            <Text style={styles.muted}>{catalogLabel(service.name)}</Text>
            <Text style={styles.muted}>{formatPrice(service.price)}</Text>
          </View>
        ))}
        <View style={styles.between}>
          <Text style={styles.bold}>{t('Total')}</Text>
          <Text style={styles.bold}>{formatPrice(booking.total)}</Text>
        </View>
        {isOpen(booking.status) ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('Cancelar agendamento')}
            onPress={() => cancel(booking)}
            style={styles.cancel}
          >
            <Text style={styles.cancelText}>{t('Cancelar agendamento')}</Text>
          </Pressable>
        ) : null}
      </View>
    );
  };

  return (
    <Screen edges={['top']}>
      <Text accessibilityRole="header" style={styles.title}>
        {t('Agenda')}
      </Text>
      {mineLoading ? (
        <Spinner small />
      ) : (
        <>
          <Text accessibilityRole="header" style={styles.heading}>
            {t('Próximos')}
          </Text>
          {upcoming.length ? (
            upcoming.map(renderBooking)
          ) : (
            <Text style={styles.muted}>
              {t('Você não tem agendamentos. Escolha um profissional e agende um serviço.')}
            </Text>
          )}
          {history.length ? (
            <>
              <Text accessibilityRole="header" style={styles.heading}>
                {t('Histórico')}
              </Text>
              {history.map(renderBooking)}
            </>
          ) : null}
        </>
      )}
    </Screen>
  );
}

const statusStyle = (booking: Booking) =>
  booking.status === 'confirmed' || booking.status === 'completed'
    ? { color: fixed.success }
    : booking.status === 'pending'
      ? { color: fixed.warning }
      : { color: fixed.dangerStrong };

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '700', color: fixed.ink },
  heading: { fontSize: 20, fontWeight: '700', color: fixed.ink },
  muted: { color: fixed.gray },
  bold: { fontWeight: '700', color: fixed.ink },
  link: { color: fixed.accentText, fontWeight: '600', paddingVertical: 8 },
  card: {
    gap: 6,
    padding: 14,
    borderWidth: 1,
    borderColor: fixed.borderSoft,
    borderRadius: 14,
    backgroundColor: fixed.white,
  },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  name: { fontSize: 17, fontWeight: '700', color: fixed.ink },
  when: { fontWeight: '600', color: fixed.ink },
  status: { fontWeight: '700', fontSize: 13 },
  address: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cancel: { alignSelf: 'flex-start', paddingVertical: 8 },
  cancelText: { color: fixed.dangerStrong, fontWeight: '600' },
});
