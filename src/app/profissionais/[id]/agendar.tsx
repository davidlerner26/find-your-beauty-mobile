import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { BackButton } from '../../../components/back-button';
import { Button } from '../../../components/button';
import { Guard } from '../../../components/guard';
import { Screen } from '../../../components/screen';
import { Spinner } from '../../../components/spinner';
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

  return (
    <Screen>
      <BackButton />
      <Text accessibilityRole="header" style={styles.title}>
        {t('Agendar serviço')}
      </Text>
      <Text style={styles.muted}>
        {services.map((service) => service.name).join(', ')} · {artist.name}
      </Text>

      <Text accessibilityRole="header" style={styles.heading}>
        {t('Onde')}
      </Text>
      {canChoosePlace ? (
        <View style={styles.row}>
          {(['home', 'studio'] as const).map((option) => (
            <Pressable
              key={option}
              accessibilityRole="button"
              accessibilityState={{ selected: place === option }}
              accessibilityLabel={
                option === 'home' ? t('A domicílio') : t('No endereço do profissional')
              }
              onPress={() => setPlace(option)}
              style={[styles.option, place === option && styles.optionOn]}
            >
              <MaterialIcons
                name={option === 'home' ? 'home' : 'place'}
                size={18}
                color={place === option ? fixed.white : fixed.ink}
              />
              <Text style={{ color: place === option ? fixed.white : fixed.ink }}>
                {option === 'home' ? t('A domicílio') : t('No endereço do profissional')}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <Text style={styles.bold}>
          {effectivePlace === 'home'
            ? t('Atendimento a domicílio')
            : localizeAddress(artist.address)}
        </Text>
      )}

      <Text accessibilityRole="header" style={styles.heading}>
        {t('Data')}
      </Text>
      <View style={styles.between}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('Mês anterior')}
          disabled={flow.isCurrentMonth}
          onPress={() => flow.changeMonth(-1)}
          style={{ opacity: flow.isCurrentMonth ? 0.3 : 1 }}
        >
          <MaterialIcons name="chevron-left" size={28} color={fixed.ink} />
        </Pressable>
        <Text style={styles.bold}>{flow.monthLabel}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('Próximo mês')}
          onPress={() => flow.changeMonth(1)}
        >
          <MaterialIcons name="chevron-right" size={28} color={fixed.ink} />
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
      >
        {flow.days.map((day) => {
          const selected = flow.selectedDay?.getTime() === day.date.getTime();
          return (
            <Pressable
              key={day.number}
              accessibilityRole="button"
              accessibilityLabel={day.date.toLocaleDateString(undefined, { dateStyle: 'full' })}
              accessibilityState={{ selected, disabled: day.disabled }}
              disabled={day.disabled}
              onPress={() => flow.pickDay(day.date)}
              style={[styles.day, selected && styles.optionOn, day.disabled && { opacity: 0.35 }]}
            >
              <Text style={{ color: selected ? fixed.white : fixed.gray }}>{day.weekday}</Text>
              <Text style={[styles.bold, selected && { color: fixed.white }]}>{day.number}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text accessibilityRole="header" style={styles.heading}>
        {t('Horário')}
      </Text>
      {!flow.selectedDay ? (
        <Text style={styles.muted}>{t('Escolha uma data para ver os horários.')}</Text>
      ) : flow.loadingTimes ? (
        <Spinner small />
      ) : flow.times.length ? (
        <View style={styles.wrap}>
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
                style={[styles.time, selected && styles.optionOn, blocked && { opacity: 0.35 }]}
              >
                <Text style={{ color: selected ? fixed.white : fixed.ink, fontWeight: '600' }}>
                  {time}
                </Text>
                {price !== null ? (
                  <Text style={{ color: selected ? fixed.white : fixed.gray, fontSize: 12 }}>
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
        <Text style={styles.muted}>
          {t('Os horários apagados coincidem com outro agendamento seu.')}
        </Text>
      ) : null}

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

      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}

      <View style={styles.between}>
        <Text style={styles.bold}>
          {t('Total')} ({services.length} {services.length === 1 ? t('serviço') : t('serviços')})
        </Text>
        <Text style={styles.total}>{formatPrice(total)}</Text>
      </View>
      <Button
        label={t('Finalizar')}
        onPress={() => void checkout()}
        loading={saving}
        disabled={!canCheckout}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: '700', color: fixed.ink },
  heading: { fontSize: 18, fontWeight: '700', color: fixed.ink, marginTop: 4 },
  muted: { color: fixed.gray },
  bold: { fontWeight: '700', color: fixed.ink },
  total: { fontSize: 20, fontWeight: '700', color: fixed.ink },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  wrap: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: fixed.border,
  },
  optionOn: { backgroundColor: fixed.brand, borderColor: fixed.brand },
  day: {
    width: 52,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: fixed.border,
  },
  time: {
    minWidth: 80,
    minHeight: 44,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: fixed.border,
  },
  input: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: fixed.border,
    borderRadius: 12,
    padding: 12,
    textAlignVertical: 'top',
    color: fixed.ink,
  },
  error: { color: fixed.dangerStrong },
});
