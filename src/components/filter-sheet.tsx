import { MaterialIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from './text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { t } from '../i18n';
import { fixed, radius } from '../theme/colors';
import { useTheme } from '../theme/theme';
import { catalogLabel } from '../utils/catalog';
import { monthDays, startOfDay, startOfMonth } from '../utils/calendar';
import { INTL_LOCALE } from '../utils/locale';
import { Filters, MAX_KM, noFilters, SortKey } from '../utils/search-filter';
import { Button } from './button';
import { Chip } from './chip';
import { SelectField } from './select-field';

const RATINGS = [1, 2, 3, 4, 5];

type Props = {
  visible: boolean;
  applied: Filters;
  allTags: string[];
  neighborhoods: string[];
  hasPosition: boolean;
  onApply: (filters: Filters) => void;
  onClose: () => void;
};

const Title = ({ children }: { children: string }) => (
  <Text accessibilityRole="header" style={styles.title}>
    {children}
  </Text>
);

// The filters of the search. It edits a draft: the filters only change when "Mostrar resultados" is pressed.
export function FilterSheet(props: Props) {
  // The body is only there while the sheet is open, so every opening starts from what is applied
  return (
    <Modal
      visible={props.visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={props.onClose}
    >
      {props.visible ? <FilterBody {...props} /> : null}
    </Modal>
  );
}

function FilterBody({ applied, allTags, neighborhoods, hasPosition, onApply, onClose }: Props) {
  const theme = useTheme();
  const [draft, setDraft] = useState<Filters>({ ...applied, tags: [...applied.tags] });
  const [month, setMonth] = useState(() => startOfMonth(new Date()));

  const set = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));
  const today = startOfDay(new Date());
  const days = useMemo(() => monthDays(month, (date) => date < today), [month, today]);
  const isCurrentMonth = month.getTime() === startOfMonth(today).getTime();
  const monthLabel = month.toLocaleDateString(INTL_LOCALE, { month: 'long', year: 'numeric' });

  const sorts: { key: SortKey; label: string }[] = [
    { key: 'distance', label: t('Mais perto') },
    { key: 'rating', label: t('Melhor avaliação') },
    { key: 'price-asc', label: t('Menor preço') },
    { key: 'price-desc', label: t('Maior preço') },
  ];

  const toggleTag = (tag: string) =>
    set(
      'tags',
      draft.tags.includes(tag) ? draft.tags.filter((x) => x !== tag) : [...draft.tags, tag],
    );

  return (
    <>
      <SafeAreaView style={styles.sheet}>
        <View style={styles.head}>
          <Button variant="link" label={t('Cancelar')} onPress={onClose} />
          <Text accessibilityRole="header" style={styles.headTitle}>
            {t('Filtros')}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('Redefinir')}
            onPress={() => setDraft(noFilters())}
            style={styles.reset}
          >
            <Text style={styles.resetText}>{t('Redefinir')}</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.body}>
          <Title>{t('Ordenar por')}</Title>
          <View style={styles.wrap}>
            {sorts.map((option) => (
              <Chip
                key={option.key}
                label={option.label}
                active={draft.sort === option.key}
                disabled={option.key === 'distance' && !hasPosition}
                onPress={() => set('sort', draft.sort === option.key ? null : option.key)}
              />
            ))}
          </View>
          {!hasPosition ? (
            <Text style={styles.muted}>
              {t('Permita a localização para ordenar por distância.')}
            </Text>
          ) : null}

          <Title>{t('Bairro')}</Title>
          <SelectField
            label={t('Bairro')}
            value={draft.neighborhood}
            options={[
              { value: null, label: t('Todos os bairros do Rio de Janeiro') },
              ...neighborhoods.map((name) => ({ value: name, label: name })),
            ]}
            onChange={(value) => set('neighborhood', value)}
          />

          <Title>{t('Disponível em')}</Title>
          <View style={styles.month}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('Mês anterior')}
              disabled={isCurrentMonth}
              onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
              style={{ opacity: isCurrentMonth ? 0.3 : 1 }}
            >
              <MaterialIcons name="chevron-left" size={28} color={theme.primary} />
            </Pressable>
            <Text style={[styles.bold, styles.capital]}>{monthLabel}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('Próximo mês')}
              onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
            >
              <MaterialIcons name="chevron-right" size={28} color={theme.primary} />
            </Pressable>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.days}
          >
            {days.map((day) => {
              const selected = draft.date?.getTime() === day.date.getTime();
              const isToday = day.date.getTime() === today.getTime();
              return (
                <Pressable
                  key={day.number}
                  accessibilityRole="button"
                  accessibilityLabel={day.date.toLocaleDateString(INTL_LOCALE, {
                    dateStyle: 'full',
                  })}
                  accessibilityState={{ selected, disabled: day.disabled }}
                  disabled={day.disabled}
                  onPress={() => set('date', selected ? null : day.date)}
                  style={[
                    styles.day,
                    isToday && { borderColor: theme.primary },
                    selected && { backgroundColor: theme.primary, borderColor: theme.primary },
                    day.disabled && { opacity: 0.35 },
                  ]}
                >
                  <Text style={[styles.capital, { color: selected ? fixed.white : fixed.gray }]}>
                    {day.weekday}
                  </Text>
                  <Text style={[styles.dayNumber, selected && { color: fixed.white }]}>
                    {day.number}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Title>{t('Serviço')}</Title>
          <View style={styles.wrap}>
            {allTags.map((tag) => (
              <Chip
                key={tag}
                label={catalogLabel(tag)}
                active={draft.tags.includes(tag)}
                onPress={() => toggleTag(tag)}
              />
            ))}
          </View>

          <Title>{t('Atendimento')}</Title>
          <View style={styles.wrap}>
            <Chip
              label={t('A domicílio')}
              active={draft.home}
              onPress={() => set('home', !draft.home)}
            />
            <Chip
              label={t('No estúdio')}
              active={draft.studio}
              onPress={() => set('studio', !draft.studio)}
            />
          </View>

          <Title>{t('Avaliação')}</Title>
          <View style={styles.stars}>
            {RATINGS.map((star) => (
              <Pressable
                key={star}
                accessibilityRole="button"
                accessibilityLabel={
                  star === 1 ? t('1 estrela') : t('{{count}} estrelas', { count: star })
                }
                accessibilityState={{ selected: star <= draft.minRating }}
                onPress={() => set('minRating', draft.minRating === star ? 0 : star)}
              >
                <MaterialIcons
                  name="star"
                  size={36}
                  color={star <= draft.minRating ? fixed.accent : fixed.border}
                />
              </Pressable>
            ))}
          </View>
          <Text style={{ color: theme.primary }}>
            {draft.minRating
              ? t('{{count}} estrelas ou mais', { count: draft.minRating })
              : t('Qualquer nota')}
          </Text>

          <Title>{t('Distância')}</Title>
          <Slider
            accessibilityLabel={t('Distância')}
            minimumValue={1}
            maximumValue={MAX_KM}
            step={1}
            value={draft.maxKm}
            disabled={!hasPosition}
            onValueChange={(value) => set('maxKm', Math.round(value))}
            minimumTrackTintColor={theme.primary}
            thumbTintColor={theme.primary}
            maximumTrackTintColor={fixed.border}
          />
          <Text style={styles.muted}>
            {!hasPosition
              ? t('Permita a localização para filtrar por distância.')
              : draft.maxKm >= MAX_KM
                ? t('Sem limite')
                : t('Até {{km}} km', { km: draft.maxKm })}
          </Text>
        </ScrollView>

        <View style={styles.footer}>
          <Button label={t('Mostrar resultados')} onPress={() => onApply(draft)} />
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: fixed.white },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headTitle: { fontSize: 17, fontWeight: '700', color: fixed.ink },
  reset: { minHeight: 36, paddingHorizontal: 8, justifyContent: 'center' },
  resetText: { color: fixed.danger, fontSize: 16 },
  body: { paddingHorizontal: 24, paddingBottom: 24, gap: 12 },
  title: { fontSize: 18, fontWeight: '700', color: fixed.ink, marginTop: 16 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  muted: { color: fixed.gray },
  bold: { fontWeight: '700', color: fixed.ink },
  capital: { textTransform: 'capitalize' },
  month: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  days: { gap: 10, paddingVertical: 4 },
  day: {
    width: 56,
    height: 80,
    gap: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: fixed.surface,
    backgroundColor: fixed.surface,
  },
  dayNumber: { fontSize: 21, fontWeight: '700', color: fixed.ink },
  stars: { flexDirection: 'row', gap: 4 },
  footer: { padding: 24, paddingTop: 12 },
});
