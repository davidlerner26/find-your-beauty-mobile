import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from './text';
import { t } from '../i18n';
import { DateRange } from '../models/professional';
import { fixed } from '../theme/colors';
import { INTL_LOCALE } from '../utils/locale';
import {
  isBlockedDay,
  isEdgeOfRange,
  isInsideRange,
  monthCells,
  PendingRange,
  pickInRange,
} from '../utils/range-picker';
import { startOfMonth } from '../utils/calendar';

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
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('Mês anterior')}
          disabled={!canGoBack}
          onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
          style={{ opacity: canGoBack ? 1 : 0.3 }}
        >
          <MaterialIcons name="chevron-left" size={28} color={fixed.ink} />
        </Pressable>
        <Text style={styles.month}>{label}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('Próximo mês')}
          onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
        >
          <MaterialIcons name="chevron-right" size={28} color={fixed.ink} />
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
          const taken = isBlockedDay(cell.key, blocked);
          const edge = isEdgeOfRange(range, cell.key);
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
                edge && styles.edge,
                taken && styles.taken,
                cell.disabled && { opacity: 0.3 },
              ]}
            >
              <Text style={{ color: edge ? fixed.white : taken ? fixed.dangerStrong : fixed.ink }}>
                {cell.day}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  month: { fontWeight: '700', color: fixed.ink, textTransform: 'capitalize' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  weekday: { width: `${100 / 7}%`, textAlign: 'center', color: fixed.gray, paddingVertical: 4 },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  inside: { backgroundColor: fixed.surface, borderRadius: 0 },
  edge: { backgroundColor: fixed.brand },
  taken: { backgroundColor: fixed.dangerBg },
});
