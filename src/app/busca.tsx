import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Text, TextInput } from '../components/text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Chip } from '../components/chip';
import { FilterSheet } from '../components/filter-sheet';
import { TopBar } from '../components/top-bar';
import { SearchResultCard } from '../components/search-result-card';
import { useUserLocation } from '../contexts/location';
import { t } from '../i18n';
import { SearchProvider, useSearch, useSearchDispatch } from '../stores/search';
import { fixed } from '../theme/colors';
import { useTheme } from '../theme/theme';
import { catalogLabel } from '../utils/catalog';
import { Card } from '../utils/search-filter';
import { Guard } from '../components/guard';

function SearchContent() {
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
  const theme = useTheme();
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
                <Text accessibilityRole="header" style={styles.recentsTitle}>
                  {t('Recentes')}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('Limpar tudo')}
                  onPress={() => dispatch({ type: 'clearRecents' })}
                >
                  <Text style={[styles.link, { color: theme.primary }]}>{t('Limpar tudo')}</Text>
                </Pressable>
              </View>
              {search.recents.map((recent) => (
                <View key={recent} style={[styles.between, styles.recentRow]}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={recent}
                    onPress={() => submit(recent)}
                    style={styles.recent}
                  >
                    <Text style={styles.recentText}>{recent}</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('Remover {{text}}', { text: recent })}
                    hitSlop={8}
                    onPress={() => dispatch({ type: 'removeRecent', recent })}
                  >
                    <MaterialIcons name="close" size={18} color={fixed.gray} />
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
                  <Chip soft key={tag} label={catalogLabel(tag)} onPress={() => submit(tag)} />
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
      <TopBar
        title={t('Buscar')}
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              search.activeFilterCount
                ? t('Filtros ({{count}})', { count: search.activeFilterCount })
                : t('Filtros')
            }
            onPress={() => setSheet(true)}
            hitSlop={8}
            style={styles.filter}
          >
            <MaterialIcons name="filter-list" size={28} color={theme.primary} />
            {search.activeFilterCount ? (
              <Text style={styles.count}>{search.activeFilterCount}</Text>
            ) : null}
          </Pressable>
        }
      />

      <View style={styles.searchWrap}>
        <View style={[styles.input, { backgroundColor: fixed.surface }]}>
          <MaterialIcons name="search" size={24} color={theme.primary} />
          <TextInput
            accessibilityLabel={t('Buscar')}
            placeholder={t('Busque profissional ou serviço..')}
            placeholderTextColor={fixed.gray}
            value={text}
            onChangeText={change}
            onSubmitEditing={() => submit(text)}
            returnKeyType="search"
            autoCorrect={false}
            style={styles.field}
          />
          {text ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('Limpar')}
              hitSlop={8}
              onPress={() => change('')}
            >
              <MaterialIcons name="close" size={20} color={fixed.gray} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <FlatList
        data={list}
        keyExtractor={(card) => card.id}
        ListHeaderComponent={header}
        ListEmptyComponent={
          search.searching ? (
            <Text style={[styles.muted, styles.empty]}>
              {t('Nenhum profissional encontrado. Tente outra busca ou mude os filtros.')}
            </Text>
          ) : undefined
        }
        renderItem={({ item }) => <SearchResultCard card={item} />}
        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
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
  searchWrap: { paddingHorizontal: 24, paddingTop: 24 },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 56,
    paddingHorizontal: 20,
    borderRadius: 999,
  },
  field: { flex: 1, fontSize: 16, color: fixed.ink },
  filter: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  count: {
    position: 'absolute',
    top: 0,
    right: 0,
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
  list: { padding: 24, paddingBottom: 48 },
  header: { gap: 16, marginBottom: 12 },
  block: { gap: 4 },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  recentsTitle: { color: fixed.gray, fontSize: 16 },
  recentRow: { borderBottomWidth: 1, borderBottomColor: fixed.borderSoft },
  recent: { flex: 1, paddingVertical: 17 },
  recentText: { color: fixed.ink, fontSize: 16 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  heading: { fontSize: 18, fontWeight: '700', color: fixed.ink },
  muted: { color: fixed.gray },
  link: { fontSize: 16 },
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

// Closed to a signed in professional: she has her own area
export default function SearchScreen() {
  return (
    <Guard kind="clientArea">
      <SearchContent />
    </Guard>
  );
}
