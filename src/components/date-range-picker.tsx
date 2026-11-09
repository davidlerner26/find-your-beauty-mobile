import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from './text';
import { t } from '../i18n';
import { DateRange } from '../models/professional';
import { fixed } from '../theme/colors';
import { INTL_LOCALE } from '../utils/locale';
import { isInsideRange, monthCells, PendingRange, pickInRange } from '../utils/range-picker';
import { startOfMonth } from '../utils/calendar';
import { ThemeProvider } from '../theme/theme';

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

type Props = {
  range: PendingRange;
  onChange: (range: PendingRange) => void;
  // Earliest day that can be picked ("yyyy-mm-dd")
  min: string;
  // Periods that are already taken: shown on the calendar and not selectable
  blocked: DateRange[];
};

// Calendar to pick a period: the first tap sets the start (one tap is already a single day), the second the end
export function DateRangePicker({ range, onChange, min, blocked }: Props) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const canGoBack = month > startOfMonth(new Date());
  const label = new Intl.DateTimeFormat(INTL_LOCALE, { month: 'long', year: 'numeric' }).format(
    month,
  );
  const cells = monthCells(month, min);

  return (
    // A white card with the colors of the light theme, also in the professional area
    <ThemeProvider>
      <View style={styles.wrap}>
        <View style={styles.head}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('Mês anterior')}
            disabled={!canGoBack}
            onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
            style={{ opacity: canGoBack ? 1 : 0.3 }}
          >
            <MaterialIcons
              name="chevron-left"
              size={28}
              color={canGoBack ? fixed.brand : fixed.disabledText}
            />
          </Pressable>
          <Text style={styles.month}>{label}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('Próximo mês')}
            onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
          >
            <MaterialIcons name="chevron-right" size={28} color={fixed.brand} />
          </Pressable>
        </View>
        <View style={styles.grid}>
          {WEEKDAYS.map((day, n) => (
            <Text key={n} style={styles.weekday}>
              {day}
            </Text>
          ))}
          {cells.map((cell, n) => {
            if (!cell) return <View key={n} style={styles.cell} />;
            const band = blocked.find((range) => cell.key >= range.start && cell.key <= range.end);
            const taken = !!band;
            const start = range.start === cell.key;
            const end = (range.end ?? range.start) === cell.key;
            const edge = start || end;
            const inside = isInsideRange(range, cell.key);
            return (
              <Pressable
                key={n}
                accessibilityRole="button"
                accessibilityLabel={`${cell.day}`}
                accessibilityState={{ selected: edge || inside, disabled: cell.disabled || taken }}
                disabled={cell.disabled || taken}
                onPress={() => onChange(pickInRange(range, cell.key))}
                style={[
                  styles.cell,
                  inside && styles.inside,
                  // With both ends picked, the band is closed on the inner side
                  edge && styles.edge,
                  edge && !!range.end && start && !end && styles.bandStart,
                  edge && !!range.end && end && !start && styles.bandEnd,
                  band && styles.taken,
                  band && cell.key === band.start && styles.roundLeft,
                  band && cell.key === band.end && styles.roundRight,
                ]}
              >
                <Text
                  style={[
                    { color: edge ? fixed.white : taken ? fixed.danger : fixed.ink },
                    inside && { color: fixed.brand },
                    taken && styles.struck,
                    cell.disabled && !taken && { color: fixed.disabledText },
                  ]}
                >
                  {cell.day}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {blocked.length ? (
          <View style={styles.legend}>
            <View style={styles.swatch} />
            <Text style={styles.legendText}>{t('Dias já bloqueados')}</Text>
          </View>
        ) : null}
      </View>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  wrap: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: fixed.borderSoft,
    backgroundColor: fixed.white,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  month: { fontWeight: '700', color: fixed.ink, textTransform: 'capitalize' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 4 },
  weekday: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    color: fixed.gray,
    fontSize: 13,
    paddingBottom: 6,
  },
  cell: { width: `${100 / 7}%`, height: 40, alignItems: 'center', justifyContent: 'center' },
  // The days between the ends form a continuous band
  inside: { backgroundColor: fixed.surface },
  edge: { backgroundColor: fixed.brand, borderRadius: 999 },
  bandStart: { borderTopRightRadius: 0, borderBottomRightRadius: 0 },
  bandEnd: { borderTopLeftRadius: 0, borderBottomLeftRadius: 0 },
  roundLeft: { borderTopLeftRadius: 999, borderBottomLeftRadius: 999 },
  roundRight: { borderTopRightRadius: 999, borderBottomRightRadius: 999 },
  // Already blocked: a red band, closed on the ends of each blocked period
  taken: { backgroundColor: fixed.dangerBg, borderRadius: 0 },
  struck: { textDecorationLine: 'line-through' },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  swatch: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: fixed.dangerBg,
    borderWidth: 1.5,
    borderColor: fixed.danger,
  },
  legendText: { fontSize: 14, color: fixed.gray },
});
