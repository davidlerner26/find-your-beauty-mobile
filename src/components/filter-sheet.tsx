import { MaterialIcons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from './text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { t } from '../i18n';
import { fixed } from '../theme/colors';
import { catalogLabel } from '../utils/catalog';
import { monthDays, startOfDay, startOfMonth } from '../utils/calendar';
import { INTL_LOCALE } from '../utils/locale';
import { Filters, MAX_KM, noFilters, SortKey } from '../utils/search-filter';
import { Button } from './button';
import { Chip } from './chip';

const DISTANCES = [2, 5, 10, 20, MAX_KM];
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
          <Button variant="link" label={t('Redefinir')} onPress={() => setDraft(noFilters())} />
        </View>

        <ScrollView contentContainerStyle={styles.body}>
          <Title>{t('Ordenar por')}</Title>
          <View style={styles.wrap}>
            {sorts.map((option) => (
              <Chip
                key={option.key}
                label={option.label}
                active={draft.sort === option.key}
                onPress={() => {
                  if (option.key === 'distance' && !hasPosition) return;
                  set('sort', draft.sort === option.key ? null : option.key);
                }}
              />
            ))}
          </View>
          {!hasPosition ? (
            <Text style={styles.muted}>
              {t('Permita a localização para ordenar por distância.')}
            </Text>
          ) : null}

          <Title>{t('Bairro')}</Title>
          <View style={styles.wrap}>
            <Chip
              label={t('Todos os bairros do Rio de Janeiro')}
              active={draft.neighborhood === null}
              onPress={() => set('neighborhood', null)}
            />
            {neighborhoods.map((name) => (
              <Chip
                key={name}
                label={name}
                active={draft.neighborhood === name}
                onPress={() => set('neighborhood', name)}
              />
            ))}
          </View>

          <Title>{t('Disponível em')}</Title>
          <View style={styles.month}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('Mês anterior')}
              disabled={isCurrentMonth}
              onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
              style={{ opacity: isCurrentMonth ? 0.3 : 1 }}
            >
              <MaterialIcons name="chevron-left" size={28} color={fixed.ink} />
            </Pressable>
            <Text style={styles.bold}>{monthLabel}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('Próximo mês')}
              onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
            >
              <MaterialIcons name="chevron-right" size={28} color={fixed.ink} />
            </Pressable>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            {days.map((day) => {
              const selected = draft.date?.getTime() === day.date.getTime();
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
                  style={[styles.day, selected && styles.dayOn, day.disabled && { opacity: 0.35 }]}
                >
                  <Text style={{ color: selected ? fixed.white : fixed.gray }}>{day.weekday}</Text>
                  <Text style={[styles.bold, selected && { color: fixed.white }]}>
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
                  name={star <= draft.minRating ? 'star' : 'star-border'}
                  size={36}
                  color={fixed.accent}
                />
              </Pressable>
            ))}
          </View>
          <Text style={styles.muted}>
            {draft.minRating
              ? t('{{count}} estrelas ou mais', { count: draft.minRating })
              : t('Qualquer nota')}
          </Text>

          <Title>{t('Distância')}</Title>
          <View style={styles.wrap}>
            {DISTANCES.map((km) => (
              <Chip
                key={km}
                label={km === MAX_KM ? t('Qualquer') : t('Até {{km}} km', { km })}
                active={draft.maxKm === km}
                onPress={() => hasPosition && set('maxKm', km)}
              />
            ))}
          </View>
          {!hasPosition ? (
            <Text style={styles.muted}>
              {t('Permita a localização para filtrar por distância.')}
            </Text>
          ) : null}
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
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 8 },
  headTitle: { fontSize: 16, fontWeight: '700', color: fixed.ink },
  body: { padding: 16, gap: 12 },
  title: { fontSize: 18, fontWeight: '700', color: fixed.ink, marginTop: 8 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  muted: { color: fixed.gray },
  bold: { fontWeight: '700', color: fixed.ink },
  month: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  day: {
    width: 52,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: fixed.border,
  },
  dayOn: { backgroundColor: fixed.brand, borderColor: fixed.brand },
  stars: { flexDirection: 'row', gap: 4 },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: fixed.borderSoft },
});
