import { FlatList, Modal, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { t } from '../i18n';
import { catalogLabel } from '../utils/catalog';
import { Card } from '../utils/search-filter';
import { Button } from './button';
import { Chip } from './chip';
import { ExploreCard } from './explore-card';
import { Text } from './text';

type Props = {
  visible: boolean;
  cards: Card[];
  categories: string[];
  activeCategories: string[];
  selectedId: string | null;
  onToggleCategory: (name: string) => void;
  onOpen: (id: string) => void;
  onClose: () => void;
};

// "Profissionais próximos": the same professionals of the map, in the same order, as a list that comes up from the bottom
export function NearbySheet({
  visible,
  cards,
  categories,
  activeCategories,
  selectedId,
  onToggleCategory,
  onOpen,
  onClose,
}: Props) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.sheet}>
        <View style={styles.head}>
          <Text accessibilityRole="header" style={styles.title}>
            {t('Profissionais próximos')}
          </Text>
          <Button variant="link" label={t('Fechar')} onPress={onClose} />
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsScroll}
          contentContainerStyle={styles.chips}
        >
          {categories.map((name) => (
            <Chip
              key={name}
              label={catalogLabel(name)}
              active={activeCategories.includes(name)}
              onPress={() => onToggleCategory(name)}
            />
          ))}
        </ScrollView>
        <FlatList
          data={cards}
          keyExtractor={(card) => card.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.gap} />}
          ListEmptyComponent={
            <Text style={styles.empty}>{t('Nenhum profissional encontrado.')}</Text>
          }
          renderItem={({ item }) => (
            <ExploreCard
              card={item}
              selected={item.id === selectedId}
              onPress={() => onOpen(item.id)}
            />
          )}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1 },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  title: { fontSize: 20, fontWeight: '700' },
  chipsScroll: { flexGrow: 0 },
  chips: { gap: 12, paddingHorizontal: 24, paddingVertical: 16 },
  list: { paddingHorizontal: 22, paddingTop: 4, paddingBottom: 48 },
  gap: { height: 16 },
  empty: { paddingVertical: 16, paddingHorizontal: 2 },
});
