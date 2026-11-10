import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';
import { Text, TextInput } from './text';
import { t } from '../i18n';
import { Availability, DateRange } from '../models/professional';
import { fixed, Theme } from '../theme/colors';
import { useTheme } from '../theme/theme';
import { addBlockedRange, invalidDayKeys, rangeLabel } from '../utils/profile-form';
import { PendingRange } from '../utils/range-picker';
import { toDateKey } from '../utils/slots';
import { WEEKDAYS } from '../utils/weekdays';
import { Button } from './button';
import { DateRangePicker } from './date-range-picker';

const KEYS = WEEKDAYS.map(({ key }) => key);

// "0930" -> "09:30" while typing (the field takes digits only)
export const maskTime = (text: string) => {
  const digits = text.replace(/\D/g, '').slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits;
};

const useStyles = () => {
  const theme = useTheme();
  return useMemo(() => makeStyles(theme), [theme]);
};

// The days and hours the professional works, and the periods blocked for holidays and days off
export function AvailabilityEditor({
  availability,
  onChange,
}: {
  availability: Availability;
  onChange: (availability: Availability) => void;
}) {
  const styles = useStyles();
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
        variant="light"
        label={t('Bloquear período')}
        onPress={block}
        disabled={!pending.start}
      />
      {availability.blockedRanges.length ? (
        <View style={styles.chips}>
          {availability.blockedRanges.map((range) => (
            <Pressable
              key={range.start + range.end}
              accessibilityRole="button"
              accessibilityLabel={`${t('Desbloquear período')}: ${rangeLabel(range.start, range.end)}`}
              onPress={() => unblock(range)}
              style={styles.blockedChip}
            >
              <Text style={styles.blockedText}>{rangeLabel(range.start, range.end)}</Text>
              <Text style={styles.blockedText}>✕</Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <Text style={styles.muted}>{t('Nenhum período bloqueado. Use para férias e folgas.')}</Text>
      )}
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    wrap: { gap: 10 },
    heading: { fontSize: 18, fontWeight: '700', color: theme.text },
    subheading: { fontSize: 16, fontWeight: '700', color: theme.text, marginTop: 8 },
    label: { fontWeight: '600', color: theme.text },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    day: { gap: 6, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: theme.line },
    dayHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    times: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    time: {
      minWidth: 84,
      minHeight: 44,
      paddingHorizontal: 12,
      borderWidth: 1.5,
      borderColor: 'transparent',
      borderRadius: 14,
      backgroundColor: theme.field,
      fontSize: 16,
      textAlign: 'center',
      color: fixed.ink,
    },
    bold: { fontWeight: '700', color: theme.text },
    blockedChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 999,
      backgroundColor: fixed.dangerBg,
    },
    blockedText: { color: fixed.danger },
    muted: { color: theme.muted },
    error: { color: theme.errorFg },
  });
