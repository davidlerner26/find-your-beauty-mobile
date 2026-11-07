import { Link } from '../../../components/link';
import { Alert, StyleSheet } from 'react-native';
import { Text } from '../../../components/text';
import { Guard } from '../../../components/guard';
import { ProBookingCard } from '../../../components/pro-booking-card';
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
import { log } from '../../../utils/log';
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

  const card = (booking: Booking) => (
    <ProBookingCard key={booking.id} booking={booking} onAnswer={answer} />
  );

  return (
    <Screen edges={['top']}>
      <Text accessibilityRole="header" style={styles.title}>
        {t('Agenda')}
      </Text>

      {profile && !profile.published ? (
        <Link href={PATHS.proProfile as never} accessibilityRole="link" style={styles.notice}>
          {t(
            'Seu perfil não está publicado, então os clientes não encontram você. Abra o perfil, complete os dados e marque para mostrar.',
          )}
        </Link>
      ) : null}

      {pending.length ? (
        <>
          <Text accessibilityRole="header" style={styles.heading}>
            {t('Solicitações')}
          </Text>
          {pending.map(card)}
        </>
      ) : null}

      <Text accessibilityRole="header" style={styles.heading}>
        {t('Próximos')}
      </Text>
      {upcoming.length ? (
        upcoming.map(card)
      ) : (
        <Text style={styles.muted}>{t('Nenhum agendamento confirmado.')}</Text>
      )}

      {history.length ? (
        <>
          <Text accessibilityRole="header" style={styles.heading}>
            {t('Histórico')}
          </Text>
          {history.map(card)}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '700', color: fixed.ink },
  heading: { fontSize: 18, fontWeight: '700', color: fixed.ink, marginTop: 8 },
  notice: {
    backgroundColor: fixed.warningBg,
    color: fixed.warning,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  muted: { color: fixed.gray },
});
