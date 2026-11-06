import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackButton } from '../components/back-button';
import { Chip } from '../components/chip';
import { FilterSheet } from '../components/filter-sheet';
import { ProfessionalCard } from '../components/professional-card';
import { useUserLocation } from '../contexts/location';
import { t } from '../i18n';
import { SearchProvider, useSearch, useSearchDispatch } from '../stores/search';
import { fixed } from '../theme/colors';
import { catalogLabel } from '../utils/catalog';
import { Card } from '../utils/search-filter';

export default function SearchScreen() {
  return (
    <SearchProvider>
      <Search />
    </SearchProvider>
  );
}

function Search() {
  const search = useSearch();
  const dispatch = useSearchDispatch();
  const location = useUserLocation();
  const [sheet, setSheet] = useState(false);
  // The text of the box; the search runs as it changes, and is remembered when it is sent
  const [text, setText] = useState(search.term);

  const change = (value: string) => {
    setText(value);
    dispatch({ type: 'setTerm', term: value });
  };
  const submit = (value: string) => {
    setText(value);
    dispatch({ type: 'submitTerm', text: value });
  };

  const list: Card[] = search.searching ? search.results : search.suggestions;

  const header = (
    <View style={styles.header}>
      {!search.searching ? (
        <>
          {search.recents.length ? (
            <View style={styles.block}>
              <View style={styles.between}>
                <Text accessibilityRole="header" style={styles.muted}>
                  {t('Recentes')}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('Limpar tudo')}
                  onPress={() => dispatch({ type: 'clearRecents' })}
                >
                  <Text style={styles.link}>{t('Limpar tudo')}</Text>
                </Pressable>
              </View>
              {search.recents.map((recent) => (
                <View key={recent} style={styles.between}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={recent}
                    onPress={() => submit(recent)}
                    style={styles.recent}
                  >
                    <MaterialIcons name="history" size={20} color={fixed.gray} />
                    <Text style={styles.recentText}>{recent}</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('Remover {{text}}', { text: recent })}
                    hitSlop={8}
                    onPress={() => dispatch({ type: 'removeRecent', recent })}
                  >
                    <MaterialIcons name="close" size={20} color={fixed.gray} />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}

          {search.popular.length ? (
            <View style={styles.block}>
              <Text accessibilityRole="header" style={styles.heading}>
                {t('Buscas populares')}
              </Text>
              <View style={styles.wrap}>
                {search.popular.map((tag) => (
                  <Chip key={tag} label={catalogLabel(tag)} onPress={() => submit(tag)} />
                ))}
              </View>
            </View>
          ) : null}

          <Text accessibilityRole="header" style={styles.heading}>
            {t('Sugestões para você')}
          </Text>
          {!list.length ? (
            <Text style={styles.muted}>{t('Ainda não há profissionais para sugerir.')}</Text>
          ) : null}
        </>
      ) : (
        <Text style={styles.muted} accessibilityLiveRegion="polite">
          {list.length === 1 ? t('1 resultado') : t('{{count}} resultados', { count: list.length })}
        </Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.bar}>
        <BackButton />
        <View style={styles.input}>
          <MaterialIcons name="search" size={22} color={fixed.gray} />
          <TextInput
            accessibilityLabel={t('Buscar')}
            placeholder={t('Nome, serviço ou bairro')}
            placeholderTextColor={fixed.gray}
            value={text}
            onChangeText={change}
            onSubmitEditing={() => submit(text)}
            returnKeyType="search"
            autoCorrect={false}
            style={styles.field}
          />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            search.activeFilterCount
              ? t('Filtros ({{count}})', { count: search.activeFilterCount })
              : t('Filtros')
          }
          onPress={() => setSheet(true)}
          style={styles.filter}
        >
          <MaterialIcons name="tune" size={22} color={fixed.white} />
          {search.activeFilterCount ? (
            <Text style={styles.count}>{search.activeFilterCount}</Text>
          ) : null}
        </Pressable>
      </View>

      <FlatList
        data={list}
        keyExtractor={(card) => card.id}
        ListHeaderComponent={header}
        ListEmptyComponent={
          search.searching ? (
            <Text style={[styles.muted, styles.empty]}>
              {t('Nenhum profissional encontrado. Tente outro nome ou serviço.')}
            </Text>
          ) : undefined
        }
        renderItem={({ item }) => <ProfessionalCard card={item} showPrice />}
        ItemSeparatorComponent={() => <View style={{ height: 20 }} />}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
      />

      <FilterSheet
        visible={sheet}
        applied={search.applied}
        allTags={search.allTags}
        neighborhoods={search.neighborhoods}
        hasPosition={!!search.userPosition}
        onApply={(filters) => {
          dispatch({ type: 'applyFilters', filters });
          setSheet(false);
        }}
        onClose={() => setSheet(false)}
      />
      {!location.position && location.permission === 'undetermined' ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('Usar minha localização')}
          onPress={() => void location.request()}
          style={styles.locate}
        >
          <Text style={styles.locateText}>{t('Usar minha localização')}</Text>
        </Pressable>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: fixed.white },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  input: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: fixed.surface,
  },
  field: { flex: 1, minHeight: 44, fontSize: 16, color: fixed.ink },
  filter: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: fixed.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: fixed.accent,
    color: fixed.white,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 18,
    overflow: 'hidden',
  },
  list: { padding: 16, paddingBottom: 48 },
  header: { gap: 16, marginBottom: 12 },
  block: { gap: 8 },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  recent: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minHeight: 36 },
  recentText: { color: fixed.ink, fontSize: 16 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  heading: { fontSize: 20, fontWeight: '700', color: fixed.ink },
  muted: { color: fixed.gray },
  link: { color: fixed.accentText, fontWeight: '600' },
  empty: { textAlign: 'center', marginTop: 24 },
  locate: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    backgroundColor: fixed.brand,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
  },
  locateText: { color: fixed.white, fontWeight: '600' },
});
