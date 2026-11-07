import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import MapView from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Chip } from '../../components/chip';
import { ExploreCard } from '../../components/explore-card';
import { MapPin } from '../../components/map-pin';
import { NearbySheet } from '../../components/nearby-sheet';
import { useUserLocation } from '../../contexts/location';
import { useProfessionals } from '../../contexts/professionals';
import { useToast } from '../../contexts/toast';
import { t } from '../../i18n';
import { SERVICE_NAMES, ServiceCategory } from '../../models/professional';
import { fixed } from '../../theme/colors';
import { catalogLabel } from '../../utils/catalog';
import { mapProfessionals, mapServiceTags, nearestFirst } from '../../utils/map-filter';
import { PATHS } from '../../utils/paths';
import { toCard } from '../../utils/search-filter';

// Where the professionals are: Rio de Janeiro
const RIO = { latitude: -22.9845, longitude: -43.205, latitudeDelta: 0.12, longitudeDelta: 0.12 };
const CATEGORIES = Object.keys(SERVICE_NAMES) as ServiceCategory[];
const GAP = 16;
const SIDES = 24;

// The width of a card of the carousel: min(24rem, screen - 5rem), like the site
const cardWidth = (screen: number) => Math.min(384, screen - 80);

export default function Explore() {
  const router = useRouter();
  const toast = useToast();
  const { width: screen } = useWindowDimensions();
  const params = useLocalSearchParams<{ service?: string; categories?: string }>();
  const { published } = useProfessionals();
  const location = useUserLocation();
  const map = useRef<MapView>(null);
  const carousel = useRef<FlatList>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const [categories, setCategories] = useState<string[]>([...CATEGORIES]);
  const [services, setServices] = useState<string[]>([]);
  // The user asked for "my location" and the position has not arrived yet
  const locating = useRef(false);
  const centered = useRef(false);
  const width = cardWidth(screen);

  // Coming from a service of the home: its categories (or its own) start selected, and so does its chip.
  // Adjusted while rendering (not in an effect) when the params change.
  const fromHome = `${params.service ?? ''}|${params.categories ?? ''}`;
  const [seenHome, setSeenHome] = useState('|');
  if (fromHome !== seenHome) {
    setSeenHome(fromHome);
    if (params.service) {
      const chosen = (params.categories ?? '')
        .split(',')
        .filter((name) => CATEGORIES.includes(name as ServiceCategory));
      const own = CATEGORIES.find((key) => SERVICE_NAMES[key].includes(params.service as string));
      if (chosen.length) setCategories(chosen);
      else if (own) setCategories([own]);
      setServices([params.service]);
      setSelectedId(null);
    }
  }

  const serviceTags = useMemo(() => mapServiceTags(published, categories), [published, categories]);

  // Closest first, on the map, in the carousel and in the list
  const cards = useMemo(
    () =>
      nearestFirst(
        mapProfessionals(
          published,
          // Every category selected is the same as none: nobody is left out
          categories.length === CATEGORIES.length ? [] : categories,
          services,
        ).map((professional) => toCard(professional, location.position)),
      ),
    [published, categories, services, location.position],
  );
  const selectedIndex = cards.findIndex((card) => card.id === selectedId);

  const goTo = useCallback((lat: number, lng: number, delta = 0.05) => {
    map.current?.animateToRegion(
      { latitude: lat, longitude: lng, latitudeDelta: delta, longitudeDelta: delta },
      400,
    );
  }, []);

  // The map goes to the user as soon as the position is known (once: it must not take the map back later)
  useEffect(() => {
    const position = location.position;
    if (!position) return;
    if (locating.current) {
      locating.current = false;
      goTo(position.lat, position.lng);
    } else if (!centered.current) {
      goTo(position.lat, position.lng, 0.08);
    }
    centered.current = true;
  }, [location.position, goTo]);

  const select = (index: number) => {
    const card = cards[index];
    if (!card) return;
    setSelectedId(card.id);
    goTo(card.position.lat, card.position.lng, 0.03);
    carousel.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
  };

  // The first tap selects the card; tapping the selected one (or any card of the list) opens the professional
  const onCard = (index: number) =>
    index === selectedIndex ? open(cards[index].id) : select(index);
  const open = (id: string) => {
    setListOpen(false);
    router.push(PATHS.professional(id) as never);
  };

  const toggleCategory = (name: string) => {
    setSelectedId(null);
    // At least one stays selected
    setCategories((current) =>
      current.includes(name)
        ? current.length > 1
          ? current.filter((c) => c !== name)
          : current
        : [...current, name],
    );
  };
  const toggleService = (name: string) => {
    setSelectedId(null);
    setServices((current) =>
      current.includes(name) ? current.filter((n) => n !== name) : [...current, name],
    );
  };

  const locateMe = async () => {
    if (location.position) return goTo(location.position.lat, location.position.lng);
    locating.current = true;
    if (!(await location.request())) {
      locating.current = false;
      toast.show(t('Não foi possível obter a sua localização. Permita o acesso nos ajustes.'));
    }
  };

  return (
    <View style={styles.flex}>
      <MapView
        ref={map}
        style={styles.flex}
        initialRegion={RIO}
        showsUserLocation={location.permission === 'granted'}
        showsPointsOfInterests={false}
        toolbarEnabled={false}
        onPress={() => setSelectedId(null)}
        accessibilityLabel={t('Mapa de profissionais de beleza')}
      >
        {cards.map((card, index) => (
          <MapPin
            key={card.id}
            lat={card.position.lat}
            lng={card.position.lng}
            selected={card.id === selectedId}
            onPress={() => select(index)}
          />
        ))}
      </MapView>

      <SafeAreaView edges={['top']} style={styles.top} pointerEvents="box-none">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {CATEGORIES.map((category) => (
            <Chip
              key={category}
              label={catalogLabel(category)}
              active={categories.includes(category)}
              onPress={() => toggleCategory(category)}
            />
          ))}
        </ScrollView>
        {serviceTags.length ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
          >
            {serviceTags.map((name) => (
              <Chip
                key={name}
                small
                label={catalogLabel(name)}
                active={services.includes(name)}
                onPress={() => toggleService(name)}
              />
            ))}
          </ScrollView>
        ) : null}
      </SafeAreaView>

      <View style={styles.bottom} pointerEvents="box-none">
        <View style={styles.buttons} pointerEvents="box-none">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('Lista')}
            onPress={() => setListOpen(true)}
            style={styles.round}
          >
            <MaterialIcons name="format-list-bulleted" size={24} color={fixed.brand} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('Minha localização')}
            onPress={() => void locateMe()}
            style={styles.round}
          >
            <MaterialIcons name="my-location" size={24} color={fixed.brand} />
          </Pressable>
        </View>
        <FlatList
          ref={carousel}
          data={cards}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(card) => card.id}
          snapToInterval={width + GAP}
          decelerationRate="fast"
          contentContainerStyle={styles.cards}
          ItemSeparatorComponent={() => <View style={{ width: GAP }} />}
          getItemLayout={(_, index) => ({
            length: width + GAP,
            offset: SIDES + (width + GAP) * index,
            index,
          })}
          renderItem={({ item, index }) => (
            <ExploreCard
              card={item}
              width={width}
              selected={item.id === selectedId}
              onPress={() => onCard(index)}
            />
          )}
        />
      </View>

      <NearbySheet
        visible={listOpen}
        cards={cards}
        categories={CATEGORIES}
        activeCategories={categories}
        selectedId={selectedId}
        onToggleCategory={toggleCategory}
        onOpen={open}
        onClose={() => setListOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  top: { position: 'absolute', top: 0, left: 0, right: 0 },
  chips: { gap: 12, paddingHorizontal: SIDES, paddingVertical: 6 },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 16, gap: 12 },
  buttons: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: SIDES },
  cards: { paddingHorizontal: SIDES, paddingVertical: 4 },
  round: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: fixed.white,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
});
