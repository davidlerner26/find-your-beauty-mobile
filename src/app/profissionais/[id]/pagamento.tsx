import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../../../components/text';
import { Button } from '../../../components/button';
import { Guard } from '../../../components/guard';
import { Screen } from '../../../components/screen';
import { TopBar } from '../../../components/top-bar';
import { useAuth } from '../../../contexts/auth';
import { useCheckoutDraft } from '../../../contexts/checkout-draft';
import { useToast } from '../../../contexts/toast';
import { t } from '../../../i18n';
import { formatDuration } from '../../../models/professional';
import { createBooking } from '../../../services/bookings';
import { fixed, radius } from '../../../theme/colors';
import { useTheme } from '../../../theme/theme';
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
  const theme = useTheme();
  const insets = useSafeAreaInsets();
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
    <Screen scroll={false} padded={false} edges={['top']}>
      <TopBar title={t('Pagamento')} />
      <ScrollView contentContainerStyle={styles.content}>
        {/* The summary as a ticket: a light card with a tear-off cut at the sides before the total */}
        <View
          accessibilityLabel={t('Resumo do agendamento')}
          style={[styles.ticket, { backgroundColor: theme.primaryLight }]}
        >
          <View style={styles.facts}>
            <Fact
              label={t('Data')}
              value={request.startsAt.toLocaleDateString(INTL_LOCALE, {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            />
            <Fact label={t('Horário')} value={formatClock(request.startsAt)} />
            <Fact label={t('Profissional')} value={request.professionalName} />
            <Fact label={t('Duração')} value={formatDuration(request.durationMinutes)} />
          </View>

          <View style={[styles.rule, { borderTopColor: theme.line }]} />

          <Text accessibilityRole="header" style={styles.servicesTitle}>
            {t('Serviços')}
          </Text>
          <View style={styles.lines}>
            {request.services.map((service) => (
              <View key={service.id} style={styles.line}>
                <Text style={[styles.lineName, { color: theme.text }]}>
                  {catalogLabel(service.name)}
                </Text>
                <Text style={[styles.price, { color: theme.primary }]}>
                  {formatPrice(service.price)}
                </Text>
              </View>
            ))}
          </View>

          <View style={[styles.dashed, { borderTopColor: theme.lineStrong }]}>
            <View style={[styles.notch, styles.notchLeft, { backgroundColor: theme.background }]} />
            <View
              style={[styles.notch, styles.notchRight, { backgroundColor: theme.background }]}
            />
          </View>

          <View style={styles.total}>
            <Text style={styles.bold}>{t('Total')}</Text>
            <Text style={[styles.bold, { color: theme.primary }]}>
              {formatPrice(request.total)}
            </Text>
          </View>

          <View
            style={[
              styles.method,
              { borderColor: theme.primary, backgroundColor: theme.primaryLight },
            ]}
          >
            <View style={styles.brand}>
              <View style={[styles.dot, { backgroundColor: theme.primary }]} />
              <View style={[styles.dot, styles.dotBack, { backgroundColor: fixed.accent }]} />
            </View>
            <View style={styles.methodText}>
              <Text numberOfLines={1} style={styles.bold}>
                {holder}
              </Text>
              <Text style={[styles.note, { color: theme.muted }]}>
                {t('Cartão de teste •••• 4242')}
              </Text>
            </View>
          </View>
        </View>

        <Text style={[styles.note, styles.center, { color: theme.muted }]}>
          {t('Ambiente de teste: o pagamento é simulado e nada é cobrado.')}
        </Text>
        {error ? (
          <Text accessibilityRole="alert" style={[styles.center, { color: theme.errorFg }]}>
            {error}
          </Text>
        ) : null}
      </ScrollView>

      <View style={[styles.bar, { paddingBottom: 16 + insets.bottom }]}>
        <Button
          label={paying ? t('Processando...') : t('Pagar agora')}
          onPress={() => void pay()}
          loading={paying}
        />
      </View>
    </Screen>
  );
}

// One of the four facts at the top of the ticket
function Fact({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={styles.fact}>
      <Text style={{ color: theme.text }}>{label}</Text>
      <Text style={[styles.bold, { color: theme.primary }]}>{value}</Text>
    </View>
  );
}

const NOTCH = 24;

const styles = StyleSheet.create({
  content: { padding: 24, gap: 16, flexGrow: 1 },
  ticket: { padding: 24, borderRadius: 20 },
  facts: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 20, columnGap: 16 },
  fact: { width: '47%', gap: 4 },
  rule: { marginVertical: 20, borderTopWidth: 1 },
  servicesTitle: { marginBottom: 16, textAlign: 'center' },
  lines: { gap: 16 },
  line: { flexDirection: 'row', justifyContent: 'space-between', gap: 16 },
  lineName: { flex: 1, fontWeight: '700' },
  price: { fontWeight: '700' },
  // The dashed line with a half circle cut out of each side (circles in the color of the page, centered on the edge)
  dashed: { marginVertical: 24, borderTopWidth: 1.5, borderStyle: 'dashed' },
  notch: {
    position: 'absolute',
    top: -NOTCH / 2,
    width: NOTCH,
    height: NOTCH,
    borderRadius: NOTCH / 2,
  },
  notchLeft: { left: -36 },
  notchRight: { right: -36 },
  total: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  bold: { fontWeight: '700' },
  method: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1.5,
    borderRadius: radius.pill,
  },
  methodText: { flex: 1, gap: 2 },
  brand: { flexDirection: 'row' },
  dot: { width: 24, height: 24, borderRadius: 12 },
  dotBack: { marginLeft: -9 },
  note: { fontSize: 14 },
  center: { textAlign: 'center' },
  bar: {
    paddingTop: 16,
    paddingHorizontal: 24,
    backgroundColor: fixed.white,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -6 },
    elevation: 12,
  },
});
