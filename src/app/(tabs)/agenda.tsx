import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { Alert, StyleSheet } from 'react-native';
import { Text } from '../../components/text';
import { BookingCard } from '../../components/booking-card';
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
import { useTheme } from '../../theme/theme';
import { log } from '../../utils/log';
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
  const router = useRouter();
  const theme = useTheme();
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

  const renderBooking = (booking: Booking) => (
    <BookingCard
      key={booking.id}
      booking={booking}
      professional={professionals.byId(booking.professionalId)}
      onCancel={cancel}
      onCopyAddress={(address) =>
        Clipboard.setStringAsync(address).then(() => toast.show(t('Endereço copiado'), 2000))
      }
    />
  );

  return (
    <Screen edges={['top']}>
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
              {t('Você não tem agendamentos.')}{' '}
              <Text
                accessibilityRole="link"
                style={{ color: theme.primary }}
                onPress={() => router.push(PATHS.explore as never)}
              >
                {t('Encontre um profissional')}
              </Text>
              .
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

const styles = StyleSheet.create({
  heading: { fontSize: 18, fontWeight: '700', color: fixed.ink, marginTop: 8 },
  muted: { color: fixed.gray },
});
