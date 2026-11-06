import { Link } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Guard } from '../../../components/guard';
import { Screen } from '../../../components/screen';
import { useAuth } from '../../../contexts/auth';
import { useBookings } from '../../../contexts/bookings';
import { useProfessionals } from '../../../contexts/professionals';
import { useToast } from '../../../contexts/toast';
import { t } from '../../../i18n';
import { ProfessionalAnswer } from '../../../../shared/domain';
import { Booking } from '../../../models/booking';
import { setBookingStatus } from '../../../services/bookings';
import { fixed } from '../../../theme/colors';
import { proAgendaLists } from '../../../utils/booking-lists';
import { bookingDateLabel, statusLabel } from '../../../utils/booking-labels';
import { catalogLabel } from '../../../utils/catalog';
import { formatClock } from '../../../utils/format-date';
import { log } from '../../../utils/log';
import { formatPrice } from '../../../utils/money';
import { PATHS } from '../../../utils/paths';

export default function ProAgendaScreen() {
  return (
    <Guard kind="pro">
      <ProAgenda />
    </Guard>
  );
}

function ProAgenda() {
  const { received } = useBookings();
  const toast = useToast();
  const uid = useAuth().user?.uid ?? '';
  const profile = useProfessionals().byId(uid);
  const { pending, upcoming, history } = proAgendaLists(received);

  const answer = (booking: Booking, status: ProfessionalAnswer) => {
    const run = () => {
      const done = {
        confirmed: t('Agendamento confirmado. O cliente foi avisado.'),
        declined: t('Solicitação recusada. O cliente foi avisado.'),
        cancelledByProfessional: t('Agendamento cancelado. O cliente foi avisado.'),
        completed: t('Agendamento concluído'),
      }[status];
      setBookingStatus(booking, status)
        .then(() => toast.show(done))
        .catch((error) => {
          log.error('Failed to update booking', error);
          toast.show(t('Não foi possível atualizar o agendamento. Tente novamente.'));
        });
    };
    // Cancelling a confirmed booking can't be undone: the client is told and the time is released
    if (status === 'cancelledByProfessional') {
      Alert.alert(
        t(
          'Tem certeza que deseja cancelar este agendamento? O cliente será avisado e o horário será liberado.',
        ),
        undefined,
        [
          { text: t('Voltar'), style: 'cancel' },
          { text: t('Cancelar agendamento'), style: 'destructive', onPress: run },
        ],
      );
      return;
    }
    run();
  };

  const action = (label: string, onPress: () => void, tone: 'solid' | 'danger' | 'outline') => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.action, tone === 'solid' && styles.solid, tone === 'danger' && styles.danger]}
    >
      <Text
        style={[
          styles.actionText,
          tone === 'solid' && { color: fixed.white },
          tone === 'danger' && { color: fixed.dangerStrong },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );

  const card = (booking: Booking, actions: React.ReactNode) => (
    <View key={booking.id} style={styles.card}>
      <View style={styles.between}>
        <Text style={styles.name}>{booking.clientName}</Text>
        <Text style={[styles.status, statusColor(booking)]}>{statusLabel(booking.status)}</Text>
      </View>
      <Text style={styles.when}>
        {bookingDateLabel(booking)} · {formatClock(booking.startsAt)}
      </Text>
      {booking.place === 'home' && booking.clientAddress ? (
        <Text style={styles.muted}>
          {t('Atendimento a domicílio')}: {booking.clientAddress}
        </Text>
      ) : null}
      {booking.services.map((service) => (
        <View key={service.id} style={styles.between}>
          <Text style={styles.muted}>{catalogLabel(service.name)}</Text>
          <Text style={styles.muted}>{formatPrice(service.price)}</Text>
        </View>
      ))}
      {booking.notes ? <Text style={styles.muted}>“{booking.notes}”</Text> : null}
      <View style={styles.between}>
        <Text style={styles.bold}>{t('Total')}</Text>
        <Text style={styles.bold}>{formatPrice(booking.total)}</Text>
      </View>
      {actions ? <View style={styles.actions}>{actions}</View> : null}
    </View>
  );

  return (
    <Screen edges={['top']}>
      <Text accessibilityRole="header" style={styles.title}>
        {t('Agenda')}
      </Text>

      {profile && !profile.published ? (
        <Link href={PATHS.proProfile as never} accessibilityRole="link" style={styles.notice}>
          {t('Seu perfil ainda não aparece para os clientes. Toque para completar.')}
        </Link>
      ) : null}

      <Text accessibilityRole="header" style={styles.heading}>
        {t('Solicitações')}
      </Text>
      {pending.length ? (
        pending.map((booking) =>
          card(
            booking,
            <>
              {action(t('Confirmar'), () => answer(booking, 'confirmed'), 'solid')}
              {action(t('Recusar'), () => answer(booking, 'declined'), 'danger')}
            </>,
          ),
        )
      ) : (
        <Text style={styles.muted}>{t('Nenhuma solicitação no momento.')}</Text>
      )}

      <Text accessibilityRole="header" style={styles.heading}>
        {t('Próximos')}
      </Text>
      {upcoming.length ? (
        upcoming.map((booking) =>
          card(
            booking,
            <>
              {action(
                t('Cancelar agendamento'),
                () => answer(booking, 'cancelledByProfessional'),
                'danger',
              )}
            </>,
          ),
        )
      ) : (
        <Text style={styles.muted}>{t('Nenhum agendamento confirmado.')}</Text>
      )}

      {history.length ? (
        <>
          <Text accessibilityRole="header" style={styles.heading}>
            {t('Histórico')}
          </Text>
          {history.map((booking) => card(booking, null))}
        </>
      ) : null}
    </Screen>
  );
}

const statusColor = (booking: Booking) =>
  booking.status === 'confirmed' || booking.status === 'completed'
    ? { color: fixed.success }
    : booking.status === 'pending'
      ? { color: fixed.warning }
      : { color: fixed.dangerStrong };

const styles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: '700', color: fixed.ink },
  heading: { fontSize: 20, fontWeight: '700', color: fixed.ink },
  notice: {
    backgroundColor: fixed.warningBg,
    color: fixed.warning,
    padding: 14,
    borderRadius: 12,
    overflow: 'hidden',
    fontWeight: '600',
  },
  muted: { color: fixed.gray },
  bold: { fontWeight: '700', color: fixed.ink },
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
  actions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 4 },
  action: {
    minHeight: 42,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: fixed.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  solid: { backgroundColor: fixed.brand },
  danger: { borderColor: fixed.dangerStrong },
  actionText: { fontWeight: '600', color: fixed.brand },
});
