import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Chip } from '../../components/chip';
import { Rating } from '../../components/rating';
import { useUserLocation } from '../../contexts/location';
import { useProfessionals } from '../../contexts/professionals';
import { t } from '../../i18n';
import { fixed } from '../../theme/colors';
import { catalogLabel } from '../../utils/catalog';
import { focusPosition } from '../../utils/labels';
import { ServiceCategory, shortLocationLabel } from '../../models/professional';
import { mapProfessionals } from '../../utils/map-filter';
import { PATHS } from '../../utils/paths';

// The center of Rio de Janeiro, where the professionals are
const RIO = { latitude: -22.9068, longitude: -43.1729, latitudeDelta: 0.25, longitudeDelta: 0.25 };
const CATEGORIES: ServiceCategory[] = ['Maquiagem', 'Cabelo'];

export default function Explore() {
  const router = useRouter();
  const params = useLocalSearchParams<{ service?: string; categories?: string }>();
  const { published } = useProfessionals();
  const location = useUserLocation();
  const map = useRef<MapView>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Coming from a service of the home: its categories start selected
  const fromHome = params.categories
    ?.split(',')
    .filter((name) => CATEGORIES.includes(name as ServiceCategory));
  const [categories, setCategories] = useState<string[]>(
    fromHome?.length ? fromHome : [...CATEGORIES],
  );
  const service = params.service || null;

  const shown = useMemo(
    () => mapProfessionals(published, categories, service),
    [published, categories, service],
  );
  const selected = shown.find((professional) => professional.id === selectedId) ?? null;

  const toggleCategory = (name: string) =>
    setCategories((current) =>
      current.includes(name)
        ? current.length > 1
          ? current.filter((c) => c !== name)
          : current
        : [...current, name],
    );

  const goToMe = async () => {
    const found = location.position ?? (await location.request());
    if (!found || !location.position) return;
    map.current?.animateToRegion(
      {
        latitude: location.position.lat,
        longitude: location.position.lng,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      },
      400,
    );
  };

  return (
    <View style={styles.flex}>
      <MapView
        ref={map}
        style={styles.flex}
        initialRegion={RIO}
        showsUserLocation={location.permission === 'granted'}
        onPress={() => setSelectedId(null)}
        accessibilityLabel={t('Mapa de profissionais de beleza')}
      >
        {shown.map((professional) => (
          <Marker
            key={professional.id}
            coordinate={{
              latitude: professional.position.lat,
              longitude: professional.position.lng,
            }}
            title={professional.name}
            pinColor={professional.id === selectedId ? fixed.accent : fixed.brand}
            onPress={() => setSelectedId(professional.id)}
          />
        ))}
      </MapView>

      <SafeAreaView edges={['top']} style={styles.top} pointerEvents="box-none">
        <View style={styles.chips}>
          {CATEGORIES.map((category) => (
            <Chip
              key={category}
              label={catalogLabel(category)}
              active={categories.includes(category)}
              onPress={() => toggleCategory(category)}
            />
          ))}
          {service ? (
            <Chip
              label={`${catalogLabel(service)} ✕`}
              active
              onPress={() => router.setParams({ service: '' })}
            />
          ) : null}
        </View>
      </SafeAreaView>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('Minha localização')}
        onPress={() => void goToMe()}
        style={[styles.locate, selected && { bottom: 160 }]}
      >
        <MaterialIcons name="my-location" size={22} color={fixed.brand} />
      </Pressable>

      {selected ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={selected.name}
          onPress={() => router.push(PATHS.professional(selected.id) as never)}
          style={styles.card}
        >
          <Image
            accessibilityIgnoresInvertColors
            source={{ uri: selected.image }}
            contentFit="cover"
            contentPosition={focusPosition(selected.imagePosition)}
            style={styles.cardImage}
          />
          <View style={styles.cardBody}>
            <Text numberOfLines={1} style={styles.cardName}>
              {selected.name}
            </Text>
            <Text numberOfLines={1} style={styles.muted}>
              {shortLocationLabel(selected)}
            </Text>
            <Rating rating={selected.rating} count={selected.reviewsCount} />
          </View>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  top: { position: 'absolute', top: 0, left: 0, right: 0 },
  chips: { flexDirection: 'row', gap: 8, padding: 12, flexWrap: 'wrap' },
  locate: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: fixed.white,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: fixed.ink,
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  card: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    flexDirection: 'row',
    gap: 12,
    padding: 10,
    borderRadius: 14,
    backgroundColor: fixed.white,
    elevation: 4,
    shadowColor: fixed.ink,
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  cardImage: { width: 72, height: 72, borderRadius: 10, backgroundColor: fixed.surface },
  cardBody: { flex: 1, justifyContent: 'center', gap: 2 },
  cardName: { fontSize: 16, fontWeight: '700', color: fixed.ink },
  muted: { color: fixed.gray },
});
