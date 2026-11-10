import { MaterialIcons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, ScrollViewInstance, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { t } from '../i18n';
import { fixed } from '../theme/colors';
import { ThemeProvider } from '../theme/theme';
import { HOURS, joinTime, minuteOptions, pad2, splitTime } from '../utils/time-wheel';
import { Button } from './button';
import { Text } from './text';

const ITEM = 44;
const VISIBLE = 5;

// One column of the picker: a list that snaps to a value, with the chosen one in the middle band
function Wheel({
  values,
  value,
  label,
  onChange,
}: {
  values: number[];
  value: number;
  label: string;
  onChange: (value: number) => void;
}) {
  const list = useRef<ScrollViewInstance>(null);
  const index = Math.max(0, values.indexOf(value));
  return (
    <ScrollView
      ref={list}
      accessibilityLabel={label}
      accessibilityRole="adjustable"
      accessibilityValue={{ text: pad2(value) }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(event) => {
        const next = values[index + (event.nativeEvent.actionName === 'increment' ? 1 : -1)];
        if (next !== undefined) {
          onChange(next);
          list.current?.scrollTo({ y: values.indexOf(next) * ITEM, animated: true });
        }
      }}
      showsVerticalScrollIndicator={false}
      snapToInterval={ITEM}
      decelerationRate="fast"
      // It opens on the current value (the sheet is only mounted while it is open)
      onLayout={() => list.current?.scrollTo({ y: index * ITEM, animated: false })}
      onMomentumScrollEnd={(event) => {
        const next = values[Math.round(event.nativeEvent.contentOffset.y / ITEM)];
        if (next !== undefined) onChange(next);
      }}
      style={styles.wheel}
      contentContainerStyle={styles.wheelContent}
    >
      {values.map((item) => (
        <View key={item} style={styles.item}>
          <Text style={[styles.itemText, item === value && styles.itemOn]}>{pad2(item)}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

// "Hours and minutes" of one time: two wheels with a colon between
function TimeWheels({
  title,
  time,
  onChange,
}: {
  title: string;
  time: string;
  onChange: (time: string) => void;
}) {
  const { hour, minute } = splitTime(time);
  return (
    <View style={styles.block}>
      <Text style={styles.blockTitle}>{title}</Text>
      <View style={styles.wheels}>
        <View pointerEvents="none" style={styles.band} />
        <Wheel
          values={HOURS}
          value={hour}
          label={`${title}: ${t('Hora')}`}
          onChange={(next) => onChange(joinTime(next, minute))}
        />
        <Text style={styles.colon}>:</Text>
        <Wheel
          values={minuteOptions(minute)}
          value={minute}
          label={`${title}: ${t('Minutos')}`}
          onChange={(next) => onChange(joinTime(hour, next))}
        />
      </View>
    </View>
  );
}

type Props = {
  label: string;
  start: string;
  end: string;
  onChange: (start: string, end: string) => void;
};

// The opening and the closing of a day in one field ("08:00 às 18:00"). It opens a sheet with a wheel of hours and one
// of minutes for each, like the time pickers of the phone.
export function TimeRangeField({ label, start, end, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ start, end });

  return (
    // A white field and sheet: they keep the light theme also inside the blue professional area
    <ThemeProvider>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${start} ${t('às')} ${end}`}
        onPress={() => {
          setDraft({ start, end });
          setOpen(true);
        }}
        style={styles.field}
      >
        <Text style={styles.value} numberOfLines={1}>
          {start} {t('às')} {end}
        </Text>
        <MaterialIcons name="schedule" size={18} color={fixed.ink} />
      </Pressable>

      <Modal
        visible={open}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setOpen(false)}
      >
        <SafeAreaView style={styles.sheet}>
          <View style={styles.head}>
            <Text accessibilityRole="header" style={styles.title}>
              {label}
            </Text>
            <Button variant="link" label={t('Cancelar')} onPress={() => setOpen(false)} />
          </View>
          <TimeWheels
            title={t('Abertura')}
            time={draft.start}
            onChange={(next) => setDraft((current) => ({ ...current, start: next }))}
          />
          <TimeWheels
            title={t('Fechamento')}
            time={draft.end}
            onChange={(next) => setDraft((current) => ({ ...current, end: next }))}
          />
          <View style={styles.done}>
            <Button
              label={t('Pronto')}
              onPress={() => {
                onChange(draft.start, draft.end);
                setOpen(false);
              }}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  field: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: fixed.white,
  },
  value: { flex: 1, fontSize: 16, color: fixed.ink },
  sheet: { flex: 1, backgroundColor: fixed.white },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingLeft: 24,
  },
  title: { fontSize: 18, fontWeight: '700', color: fixed.ink },
  block: { alignItems: 'center', gap: 4, marginTop: 8 },
  blockTitle: { fontWeight: '700', color: fixed.ink },
  wheels: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  // The band behind the middle row marks the chosen time
  band: {
    position: 'absolute',
    left: 56,
    right: 56,
    height: ITEM,
    borderRadius: 12,
    backgroundColor: fixed.surface,
  },
  wheel: { height: ITEM * VISIBLE, flexGrow: 0, width: 88 },
  wheelContent: { paddingVertical: ITEM * Math.floor(VISIBLE / 2) },
  item: { height: ITEM, alignItems: 'center', justifyContent: 'center' },
  itemText: { fontSize: 22, color: fixed.gray },
  itemOn: { color: fixed.ink, fontWeight: '700' },
  colon: { fontSize: 22, fontWeight: '700', color: fixed.ink },
  done: { padding: 24, marginTop: 'auto' },
});
