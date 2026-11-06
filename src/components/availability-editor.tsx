import { useState } from 'react';
import { StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { t } from '../i18n';
import { Availability, DateRange } from '../models/professional';
import { fixed } from '../theme/colors';
import { addBlockedRange, invalidDayKeys, rangeLabel } from '../utils/profile-form';
import { PendingRange } from '../utils/range-picker';
import { toDateKey } from '../utils/slots';
import { WEEKDAYS } from '../utils/weekdays';
import { Button } from './button';
import { Chip } from './chip';
import { DateRangePicker } from './date-range-picker';

const SLOT_OPTIONS = [15, 30, 45, 60, 90, 120];
const KEYS = WEEKDAYS.map(({ key }) => key);

// "0930" -> "09:30" while typing (the field takes digits only)
export const maskTime = (text: string) => {
  const digits = text.replace(/\D/g, '').slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits;
};

// The days and hours the professional works, and the periods blocked for holidays and days off
export function AvailabilityEditor({
  availability,
  onChange,
}: {
  availability: Availability;
  onChange: (availability: Availability) => void;
}) {
  const [pending, setPending] = useState<PendingRange>({ start: null, end: null });
  const invalid = invalidDayKeys(availability, KEYS);

  const setDay = (key: string, patch: Partial<Availability['weekly'][string]>) =>
    onChange({
      ...availability,
      weekly: { ...availability.weekly, [key]: { ...availability.weekly[key], ...patch } },
    });

  const block = () => {
    if (!pending.start) return;
    onChange({
      ...availability,
      blockedRanges: addBlockedRange(availability.blockedRanges, pending),
    });
    setPending({ start: null, end: null });
  };

  const unblock = (range: DateRange) =>
    onChange({
      ...availability,
      blockedRanges: availability.blockedRanges.filter((r) => r !== range),
    });

  return (
    <View style={styles.wrap}>
      <Text accessibilityRole="header" style={styles.heading}>
        {t('Horários de atendimento')}
      </Text>

      <Text style={styles.label}>{t('Duração de cada horário')}</Text>
      <View style={styles.chips}>
        {SLOT_OPTIONS.map((minutes) => (
          <Chip
            key={minutes}
            label={t('{{minutes}} min', { minutes })}
            active={availability.slotMinutes === minutes}
            onPress={() => onChange({ ...availability, slotMinutes: minutes })}
          />
        ))}
      </View>

      {WEEKDAYS.map((day) => {
        const config = availability.weekly[day.key];
        return (
          <View key={day.key} style={styles.day}>
            <View style={styles.dayHead}>
              <Text style={styles.bold}>{day.label}</Text>
              <Switch
                accessibilityLabel={day.label}
                value={config.enabled}
                onValueChange={(enabled) => setDay(day.key, { enabled })}
                trackColor={{ true: fixed.brand }}
              />
            </View>
            {config.enabled ? (
              <View style={styles.times}>
                <TextInput
                  accessibilityLabel={t('Abertura: {{day}}', { day: day.label })}
                  value={config.start}
                  onChangeText={(text) => setDay(day.key, { start: maskTime(text) })}
                  keyboardType="number-pad"
                  placeholder="08:00"
                  maxLength={5}
                  style={styles.time}
                />
                <Text style={styles.muted}>{t('às')}</Text>
                <TextInput
                  accessibilityLabel={t('Fechamento: {{day}}', { day: day.label })}
                  value={config.end}
                  onChangeText={(text) => setDay(day.key, { end: maskTime(text) })}
                  keyboardType="number-pad"
                  placeholder="18:00"
                  maxLength={5}
                  style={styles.time}
                />
              </View>
            ) : (
              <Text style={styles.muted}>{t('Folga')}</Text>
            )}
          </View>
        );
      })}
      {invalid.length ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {t('O fechamento precisa ser depois da abertura em: {{count}} dia(s).', {
            count: invalid.length,
          })}
        </Text>
      ) : null}

      <Text accessibilityRole="header" style={styles.subheading}>
        {t('Dias bloqueados')}
      </Text>
      <Text style={styles.muted}>
        {t('Toque no dia que quer bloquear. Para um período, toque também no último dia.')}
      </Text>
      <DateRangePicker
        min={toDateKey(new Date())}
        blocked={availability.blockedRanges}
        range={pending}
        onChange={setPending}
      />
      {pending.start ? (
        <Text style={styles.muted}>
          {t('Selecionado')}:{' '}
          <Text style={styles.bold}>{rangeLabel(pending.start, pending.end)}</Text>
        </Text>
      ) : null}
      <Button
        variant="outline"
        label={t('Bloquear período')}
        onPress={block}
        disabled={!pending.start}
      />
      {availability.blockedRanges.length ? (
        <View style={styles.chips}>
          {availability.blockedRanges.map((range) => (
            <Chip
              key={range.start + range.end}
              label={`${rangeLabel(range.start, range.end)} ✕`}
              active
              onPress={() => unblock(range)}
            />
          ))}
        </View>
      ) : (
        <Text style={styles.muted}>{t('Nenhum período bloqueado. Use para férias e folgas.')}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  heading: { fontSize: 20, fontWeight: '700', color: fixed.ink },
  subheading: { fontSize: 16, fontWeight: '700', color: fixed.ink, marginTop: 8 },
  label: { fontWeight: '600', color: fixed.ink },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  day: { gap: 6, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: fixed.borderSoft },
  dayHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  times: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  time: {
    minWidth: 84,
    minHeight: 42,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: fixed.border,
    borderRadius: 10,
    fontSize: 16,
    textAlign: 'center',
    color: fixed.ink,
  },
  bold: { fontWeight: '700', color: fixed.ink },
  muted: { color: fixed.gray },
  error: { color: fixed.dangerStrong },
});
