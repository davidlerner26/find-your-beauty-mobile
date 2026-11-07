import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, TextInput } from '../../../components/text';
import { BackButton } from '../../../components/back-button';
import { Guard } from '../../../components/guard';
import { Screen } from '../../../components/screen';
import { Spinner } from '../../../components/spinner';
import { TopBar } from '../../../components/top-bar';
import { useAuth } from '../../../contexts/auth';
import { useBookings } from '../../../contexts/bookings';
import { useCheckoutDraft } from '../../../contexts/checkout-draft';
import { useProfessionals } from '../../../contexts/professionals';
import { useToast } from '../../../contexts/toast';
import { t } from '../../../i18n';
import { DEFAULT_AVAILABILITY } from '../../../models/professional';
import { missingProfileData } from '../../../models/user';
import { createBooking } from '../../../services/bookings';
import { users } from '../../../services/users';
import { useBookingFlow } from '../../../stores/booking-flow';
import { fixed } from '../../../theme/colors';
import { useTheme } from '../../../theme/theme';
import { hasConflict } from '../../../utils/booking-conflict';
import { bookingErrorMessage, buildBookingRequest, totalAt } from '../../../utils/booking-request';
import { localizeAddress } from '../../../utils/address';
import { log } from '../../../utils/log';
import { formatPrice, roundMoney } from '../../../utils/money';
import { PATHS } from '../../../utils/paths';
import { checkoutEnabled } from '../../../utils/features';

export default function BookingScreen() {
  return (
    <Guard kind="client">
      <BookingLoader />
    </Guard>
  );
}

function BookingLoader() {
  const { id, servicos } = useLocalSearchParams<{ id: string; servicos?: string }>();
  const { status, byId } = useProfessionals();
  const artist = byId(id);
  if (status === 'loading') return <Spinner />;
  if (!artist) {
    return (
      <Screen>
        <BackButton />
        <Text style={styles.muted}>{t('Profissional não encontrado.')}</Text>
      </Screen>
    );
  }
  return <Booking id={id} serviceIds={(servicos ?? '').split(',')} />;
}

function Booking({ id, serviceIds }: { id: string; serviceIds: string[] }) {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const auth = useAuth();
  const toast = useToast();
  const { mine } = useBookings();
  const draft = useCheckoutDraft();
  const artist = useProfessionals().byId(id)!;

  const services = useMemo(
    () => artist.services.filter((service) => serviceIds.includes(service.id)),
    [artist, serviceIds],
  );
  const availability = artist.availability ?? DEFAULT_AVAILABILITY;
  const duration = services.reduce((sum, service) => sum + service.durationMinutes, 0) || 60;
  const flow = useBookingFlow({ professionalId: id, availability, durationMinutes: duration });
  const [notes, setNotes] = useState('');
  const [place, setPlace] = useState<'home' | 'studio'>('home');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // The price follows the start time: before a day and time are chosen, the normal prices
  const normal = roundMoney(services.reduce((sum, service) => sum + service.price, 0));
  const total =
    flow.selectedDay && flow.selectedTime
      ? totalAt(services, flow.selectedDay, flow.selectedTime)
      : normal;
  // Price of a time slot when it is different from the normal total
  const timePrice = (time: string) => {
    if (!flow.selectedDay) return null;
    const price = totalAt(services, flow.selectedDay, time);
    return price !== normal ? price : null;
  };

  // Where the professional attends: only a client of a professional that accepts both can choose
  const canChoosePlace = artist.serviceMode === 'both';
  const effectivePlace: 'home' | 'studio' =
    artist.serviceMode === 'both' ? place : artist.serviceMode === 'home' ? 'home' : 'studio';

  const conflict = (time: string) =>
    !!flow.selectedDay && hasConflict(mine, flow.selectedDay, time, duration);
  const someConflict = flow.times.some(conflict);

  const canCheckout = !!flow.selectedDay && !!flow.selectedTime && !saving && services.length > 0;

  // Finalizar: requests the booking. The professional confirms it afterwards.
  const checkout = async () => {
    const { selectedDay: day, selectedTime: time } = flow;
    const user = auth.user;
    if (!day || !time || !services.length || !user) return;

    if (conflict(time)) {
      setError(t('Você já tem um agendamento neste horário. Escolha outro horário.'));
      return;
    }

    // All the data of the profile is required: checked again here, in case it changed
    let clientAddress: string;
    setSaving(true);
    try {
      const profile = await users.get(user.uid);
      clientAddress = profile?.address?.trim() ?? '';
      const missing = missingProfileData(profile);
      if (missing.length) {
        setError(
          t('Complete seus dados no perfil para agendar. Falta: {{missing}}.', {
            missing: missing.join(', '),
          }),
        );
        return;
      }
    } catch (failure) {
      log.error('Failed to check the profile data', failure);
      setError(t('Não foi possível verificar seus dados. Tente novamente.'));
      return;
    } finally {
      setSaving(false);
    }

    const request = buildBookingRequest({
      artist,
      services,
      day,
      time,
      notes,
      place: effectivePlace,
      clientAddress,
      slotMinutes: availability.slotMinutes,
    });

    // The test environment asks for the (simulated) payment first; production books straight away
    if (checkoutEnabled()) {
      draft.set(request);
      router.push(PATHS.checkout(artist.id) as never);
      return;
    }

    setError('');
    setSaving(true);
    try {
      await createBooking(user, request);
      toast.show(
        t('Agendamento solicitado! Você será avisado quando o profissional responder.'),
        5000,
      );
      router.replace(PATHS.agenda as never);
    } catch (failure) {
      log.error('Failed to create booking', failure);
      setError(bookingErrorMessage(failure));
    } finally {
      setSaving(false);
    }
  };

  // A pill of the site: day, time or place. Selected is the light color of the theme.
  const pillStyle = (selected: boolean) => [
    styles.pill,
    selected && { backgroundColor: theme.primaryLight, borderColor: theme.primary },
  ];
  const pillText = (selected: boolean) => ({ color: selected ? theme.primary : fixed.ink });

  return (
    <Screen scroll={false} padded={false} edges={['top']}>
      <TopBar title={t('Agendar serviço')} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[styles.muted, styles.artist]}>
          {t('com')} <Text style={styles.bold}>{artist.name}</Text>
        </Text>

        {canChoosePlace ? (
          <View style={styles.section}>
            <Text accessibilityRole="header" style={styles.heading}>
              {t('Onde')}
            </Text>
            <View style={styles.times}>
              {(['home', 'studio'] as const).map((option) => (
                <Pressable
                  key={option}
                  accessibilityRole="button"
                  accessibilityState={{ selected: place === option }}
                  accessibilityLabel={
                    option === 'home' ? t('A domicílio') : t('No endereço do profissional')
                  }
                  onPress={() => setPlace(option)}
                  style={[pillStyle(place === option), styles.place]}
                >
                  <MaterialIcons
                    name={option === 'home' ? 'home' : 'location-on'}
                    size={22}
                    color={place === option ? theme.primary : fixed.ink}
                  />
                  <Text style={pillText(place === option)}>
                    {option === 'home' ? t('A domicílio') : t('No endereço do profissional')}
                  </Text>
                </Pressable>
              ))}
            </View>
            {place === 'studio' ? (
              <Text style={styles.muted}>{localizeAddress(artist.address)}</Text>
            ) : null}
          </View>
        ) : (
          <View style={[styles.placeInfo]}>
            <MaterialIcons
              name={effectivePlace === 'home' ? 'home' : 'location-on'}
              size={22}
              color={theme.primary}
            />
            <Text style={[styles.muted, { flex: 1 }]}>
              {effectivePlace === 'home'
                ? t('Atendimento a domicílio')
                : localizeAddress(artist.address)}
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <Text accessibilityRole="header" style={styles.heading}>
            {t('Data')}
          </Text>
          <View style={styles.month}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('Mês anterior')}
              disabled={flow.isCurrentMonth}
              onPress={() => flow.changeMonth(-1)}
              style={{ opacity: flow.isCurrentMonth ? 0.3 : 1 }}
            >
              <MaterialIcons name="chevron-left" size={28} color={theme.primary} />
            </Pressable>
            <Text style={[styles.bold, styles.capital]}>{flow.monthLabel}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('Próximo mês')}
              onPress={() => flow.changeMonth(1)}
            >
              <MaterialIcons name="chevron-right" size={28} color={theme.primary} />
            </Pressable>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.bleed}
            contentContainerStyle={styles.days}
          >
            {flow.days.map((day) => {
              const selected = flow.selectedDay?.getTime() === day.date.getTime();
              return (
                <Pressable
                  key={day.number}
                  accessibilityRole="button"
                  accessibilityLabel={day.date.toLocaleDateString(undefined, {
                    dateStyle: 'full',
                  })}
                  accessibilityState={{ selected, disabled: day.disabled }}
                  disabled={day.disabled}
                  onPress={() => flow.pickDay(day.date)}
                  style={[styles.day, selected && { backgroundColor: theme.primary }]}
                >
                  <Text
                    style={[
                      styles.capital,
                      {
                        color: selected ? fixed.white : day.disabled ? fixed.disabled : fixed.gray,
                      },
                    ]}
                  >
                    {day.weekday}
                  </Text>
                  <Text
                    style={[
                      styles.dayNumber,
                      { color: selected ? fixed.white : day.disabled ? fixed.disabled : fixed.ink },
                    ]}
                  >
                    {day.number}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text accessibilityRole="header" style={styles.heading}>
            {t('Horário')}
          </Text>
          {!flow.selectedDay ? (
            <Text style={styles.muted}>{t('Escolha uma data para ver os horários.')}</Text>
          ) : flow.loadingTimes ? (
            <Spinner small />
          ) : flow.times.length ? (
            <View style={styles.times}>
              {flow.times.map((time) => {
                const selected = flow.selectedTime === time;
                const blocked = conflict(time);
                const price = timePrice(time);
                return (
                  <Pressable
                    key={time}
                    accessibilityRole="button"
                    accessibilityState={{ selected, disabled: blocked }}
                    accessibilityLabel={price !== null ? `${time}, ${formatPrice(price)}` : time}
                    disabled={blocked}
                    onPress={() => flow.pickTime(time)}
                    style={[pillStyle(selected), blocked && styles.blocked]}
                  >
                    <Text style={[pillText(selected), blocked && styles.strike]}>{time}</Text>
                    {price !== null ? (
                      <Text style={[styles.timePrice, pillText(selected)]}>
                        {formatPrice(price)}
                      </Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <Text style={styles.muted}>{t('Não há horários livres neste dia.')}</Text>
          )}
          {someConflict ? (
            <Text style={[styles.muted, styles.note]}>
              {t('Os horários apagados coincidem com outro agendamento seu.')}
            </Text>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text accessibilityRole="header" style={styles.heading}>
            {t('Observações')}
          </Text>
          <TextInput
            accessibilityLabel={t('Observações')}
            placeholder={t('Alguma observação para o profissional? (opcional)')}
            placeholderTextColor={fixed.gray}
            value={notes}
            onChangeText={setNotes}
            multiline
            maxLength={500}
            style={styles.input}
          />
        </View>

        {error ? (
          <Text accessibilityRole="alert" style={[styles.error, { color: theme.errorFg }]}>
            {error}
          </Text>
        ) : null}
      </ScrollView>

      <View style={[styles.bar, { paddingBottom: 16 + insets.bottom }]}>
        <View>
          <Text>
            <Text style={styles.bold}>{t('Total')}</Text> ({services.length}{' '}
            {services.length === 1 ? t('serviço') : t('serviços')})
          </Text>
          <Text style={[styles.total, { color: theme.primary }]}>{formatPrice(total)}</Text>
        </View>
        <View style={styles.barActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('Conversar com {{name}}', { name: artist.name })}
            onPress={() => router.push(`/mensagens/${artist.id}` as never)}
            style={[styles.chatButton, { borderColor: theme.primary }]}
          >
            <MaterialIcons name="chat-bubble" size={22} color={theme.primary} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('Finalizar')}
            accessibilityState={{ disabled: !canCheckout, busy: saving }}
            disabled={!canCheckout}
            onPress={() => void checkout()}
            style={[
              styles.checkout,
              { backgroundColor: theme.primary },
              !canCheckout && { opacity: 0.5 },
            ]}
          >
            {saving ? (
              <ActivityIndicator color={theme.onPrimary} />
            ) : (
              <MaterialIcons name="check" size={28} color={theme.onPrimary} />
            )}
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 24, paddingBottom: 32 },
  artist: { marginBottom: 24 },
  section: { gap: 20, marginBottom: 40 },
  heading: { fontSize: 20, fontWeight: '700', color: fixed.ink },
  muted: { color: fixed.gray },
  bold: { fontWeight: '700', color: fixed.ink },
  capital: { textTransform: 'capitalize' },
  note: { fontSize: 14, marginTop: -8 },
  // Rows that go from edge to edge of the screen (the content has 24px on the sides)
  bleed: { marginHorizontal: -24 },
  month: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  days: { gap: 12, paddingHorizontal: 24 },
  day: {
    width: 64,
    height: 88,
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: fixed.surface,
  },
  dayNumber: { fontSize: 24, fontWeight: '700' },
  times: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  pill: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: fixed.border,
    backgroundColor: fixed.white,
  },
  place: { flexDirection: 'row', gap: 8 },
  placeInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 32 },
  blocked: { opacity: 0.4 },
  strike: { textDecorationLine: 'line-through' },
  timePrice: { fontSize: 11, opacity: 0.8 },
  input: {
    minHeight: 130,
    padding: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: fixed.surface,
    textAlignVertical: 'top',
    fontSize: 16,
    color: fixed.ink,
  },
  error: {
    padding: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: fixed.dangerBg,
  },
  bar: {
    paddingTop: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: fixed.white,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -6 },
    elevation: 12,
  },
  total: { fontSize: 24, fontWeight: '700' },
  barActions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  chatButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    backgroundColor: fixed.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkout: {
    minWidth: 144,
    height: 52,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
