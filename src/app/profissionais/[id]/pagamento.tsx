import { MaterialIcons } from '@expo/vector-icons';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../../components/text';
import { BackButton } from '../../../components/back-button';
import { Button } from '../../../components/button';
import { Guard } from '../../../components/guard';
import { Screen } from '../../../components/screen';
import { useAuth } from '../../../contexts/auth';
import { useCheckoutDraft } from '../../../contexts/checkout-draft';
import { useToast } from '../../../contexts/toast';
import { t } from '../../../i18n';
import { formatDuration } from '../../../models/professional';
import { createBooking } from '../../../services/bookings';
import { fixed } from '../../../theme/colors';
import { bookingErrorMessage } from '../../../utils/booking-request';
import { catalogLabel } from '../../../utils/catalog';
import { checkoutEnabled } from '../../../utils/features';
import { formatClock } from '../../../utils/format-date';
import { INTL_LOCALE } from '../../../utils/locale';
import { log } from '../../../utils/log';
import { formatPrice } from '../../../utils/money';
import { PATHS } from '../../../utils/paths';

// How long the simulated payment takes, so that it feels like one
const SIMULATED_PAYMENT_MS = 1200;

// The payment screen of the test environment, between "Finalizar" and the booking itself. The payment is simulated:
// nothing is charged (real card payments need a development build, see the architecture doc).
export default function CheckoutScreen() {
  return (
    <Guard kind="client">
      <Checkout />
    </Guard>
  );
}

function Checkout() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const auth = useAuth();
  const toast = useToast();
  const draft = useCheckoutDraft();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');
  const request = draft.request;

  // Only for a booking chosen on the booking screen, and only where the feature is on
  if (!checkoutEnabled() || request?.professionalId !== id) {
    return <Redirect href={PATHS.booking(id) as never} />;
  }

  const holder = auth.user?.displayName || auth.user?.email || '';

  const pay = async () => {
    if (paying || !auth.user) return;
    setError('');
    setPaying(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, SIMULATED_PAYMENT_MS));
      await createBooking(auth.user, request);
      draft.clear();
      toast.show(
        t('Agendamento solicitado! Você será avisado quando o profissional responder.'),
        5000,
      );
      router.replace(PATHS.agenda as never);
    } catch (failure) {
      log.error('Failed to book after the payment step', failure);
      setError(bookingErrorMessage(failure));
    } finally {
      setPaying(false);
    }
  };

  return (
    <Screen>
      <BackButton />
      <Text accessibilityRole="header" style={styles.title}>
        {t('Pagamento')}
      </Text>

      <View style={styles.card} accessibilityLabel={t('Resumo do agendamento')}>
        <Line
          label={t('Data')}
          value={request.startsAt.toLocaleDateString(INTL_LOCALE, {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        />
        <Line label={t('Horário')} value={formatClock(request.startsAt)} />
        <Line label={t('Profissional')} value={request.professionalName} />
        <Line label={t('Duração')} value={formatDuration(request.durationMinutes)} />
        <Text accessibilityRole="header" style={styles.bold}>
          {t('Serviços')}
        </Text>
        {request.services.map((service) => (
          <Line
            key={service.id}
            label={catalogLabel(service.name)}
            value={formatPrice(service.price)}
          />
        ))}
        <View style={styles.total}>
          <Text style={styles.bold}>{t('Total')}</Text>
          <Text style={styles.totalValue}>{formatPrice(request.total)}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardRow}>
          <MaterialIcons name="credit-card" size={24} color={fixed.brand} />
          <View>
            <Text style={styles.bold}>{holder}</Text>
            <Text style={styles.muted}>{t('Cartão de teste •••• 4242')}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.muted}>
        {t('Ambiente de teste: o pagamento é simulado e nada é cobrado.')}
      </Text>
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
      <Button
        label={paying ? t('Processando...') : t('Pagar agora')}
        onPress={() => void pay()}
        loading={paying}
      />
    </Screen>
  );
}

const Line = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.line}>
    <Text style={styles.muted}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: '700', color: fixed.ink },
  card: {
    gap: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: fixed.borderSoft,
    borderRadius: 14,
    backgroundColor: fixed.white,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  line: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  value: { color: fixed.ink, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  bold: { fontWeight: '700', color: fixed.ink },
  muted: { color: fixed.gray },
  total: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: fixed.borderSoft,
    paddingTop: 8,
  },
  totalValue: { fontSize: 18, fontWeight: '700', color: fixed.ink },
  error: { color: fixed.dangerStrong },
});
