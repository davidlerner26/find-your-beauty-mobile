import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';
import { Text } from './text';
import { t } from '../i18n';
import { Availability, DateRange } from '../models/professional';
import { fixed, Theme } from '../theme/colors';
import { useTheme } from '../theme/theme';
import { addBlockedRange, invalidDayKeys, rangeLabel } from '../utils/profile-form';
import { PendingRange } from '../utils/range-picker';
import { toDateKey } from '../utils/slots';
import { WEEKDAYS } from '../utils/weekdays';
import { Button } from './button';
import { TimeField } from './time-field';
import { DateRangePicker } from './date-range-picker';

const KEYS = WEEKDAYS.map(({ key }) => key);

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
            <Switch
              accessibilityLabel={day.label}
              value={config.enabled}
              onValueChange={(enabled) => setDay(day.key, { enabled })}
              trackColor={{ true: fixed.accent }}
              style={styles.toggle}
            />
            <Text numberOfLines={1} style={styles.dayName}>
              {day.label}
            </Text>
            {config.enabled ? (
              <>
                <TimeField
                  label={t('Abertura: {{day}}', { day: day.label })}
                  value={config.start}
                  onChange={(start) => setDay(day.key, { start })}
                />
                <Text style={styles.muted}>{t('às')}</Text>
                <TimeField
                  label={t('Fechamento: {{day}}', { day: day.label })}
                  value={config.end}
                  onChange={(end) => setDay(day.key, { end })}
                />
              </>
            ) : (
              <Text style={styles.off}>{t('Folga')}</Text>
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
    // One row per day, a see-through bar like the site: the switch, the day, and the opening and closing times
    day: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      minHeight: 60,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      backgroundColor: theme.name === 'pro' ? theme.primaryLight : fixed.surface,
    },
    toggle: { transform: [{ scale: 0.8 }], marginHorizontal: -6 },
    dayName: { flexShrink: 1, minWidth: 64, fontWeight: '600', color: theme.text },
    off: { flex: 1, textAlign: 'right', color: theme.muted },
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
