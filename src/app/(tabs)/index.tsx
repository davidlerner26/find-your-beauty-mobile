import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Link } from '../../components/link';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../../components/text';
import { Chip } from '../../components/chip';
import { FeaturedCard, FEATURED_GAP, NearbyCard } from '../../components/home-cards';
import { Screen } from '../../components/screen';
import { Spinner } from '../../components/spinner';
import { useAuth } from '../../contexts/auth';
import { useFavorites } from '../../contexts/favorites';
import { useUserLocation } from '../../contexts/location';
import { useProfessionals } from '../../contexts/professionals';
import { environment } from '../../config/environment';
import { t } from '../../i18n';
import { SERVICE_ICONS, SERVICE_NAMES, ServiceCategory } from '../../models/professional';
import { fixed } from '../../theme/colors';
import { useTheme } from '../../theme/theme';
import { catalogLabel } from '../../utils/catalog';
import { focusPosition } from '../../utils/labels';
import { PATHS } from '../../utils/paths';
import { toCard } from '../../utils/search-filter';

const INTERESTS: ServiceCategory[] = ['Maquiagem', 'Cabelo'];
const CATEGORY_ICONS: Record<ServiceCategory, string> = {
  Maquiagem: 'brush',
  Cabelo: 'content-cut',
};

// The icon names of the site are Material Symbols ("content_cut"); the font of the app writes them with a hyphen
const iconName = (name: string) => name.replace(/_/g, '-') as never;

export default function Home() {
  const router = useRouter();
  const theme = useTheme();
  const auth = useAuth();
  const favorites = useFavorites();
  const { position } = useUserLocation();
  const { published, status } = useProfessionals();
  // Chips of "Categorias": both start selected and they can be selected together
  const [active, setActive] = useState<ServiceCategory[]>([...INTERESTS]);

  const firstName = auth.user?.displayName?.trim().split(/\s+/)[0] || t('visitante');
  const cards = useMemo(() => published.map((p) => toCard(p, position)), [published, position]);
  const featured = useMemo(
    () => [...cards].sort((a, b) => b.rating - a.rating).slice(0, 8),
    [cards],
  );
  const followed = cards.filter((card) => favorites.ids.includes(card.id));

  // At least one chip always stays selected
  const toggle = (interest: ServiceCategory) =>
    setActive((current) => {
      if (!current.includes(interest)) return [...current, interest];
      return current.length > 1 ? current.filter((i) => i !== interest) : current;
    });

  const nearby = useMemo(
    () =>
      cards
        // With every chip selected nothing is filtered out, even professionals with other tags
        .filter(
          (card) =>
            active.length === INTERESTS.length ||
            card.tags.some((tag) => (active as string[]).includes(tag)),
        )
        .sort((a, b) => (a.km ?? Infinity) - (b.km ?? Infinity))
        .slice(0, 3),
    [cards, active],
  );

  // The names of the services that at least one published professional offers
  const offered = useMemo(
    () => new Set(published.flatMap((p) => p.services.map((service) => service.name))),
    [published],
  );
  const rows = INTERESTS.filter((category) => active.includes(category))
    .map((category) => ({
      category,
      services: SERVICE_NAMES[category].filter((name) => offered.has(name)),
    }))
    // A category without any service on offer leaves no empty line
    .filter((row) => row.services.length);

  return (
    <Screen edges={['top']}>
      <Image
        accessibilityIgnoresInvertColors
        source={require('../../../assets/images/logo-full.png')}
        accessibilityLabel="Find Your Beauty"
        contentFit="contain"
        style={styles.logo}
      />
      <View style={styles.hero}>
        <View style={{ flex: 1 }}>
          <Text accessibilityRole="header" style={styles.title}>
            {t('Olá, {{name}}', { name: firstName })}
          </Text>
          <Text style={styles.muted}>{t('Encontre o serviço que você quer e se cuide')}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('Buscar')}
          onPress={() => router.push(PATHS.search as never)}
          style={styles.searchButton}
        >
          <MaterialIcons name="search" size={24} color={fixed.white} />
        </Pressable>
      </View>

      {status === 'loading' ? <Spinner /> : null}
      {status === 'error' ? (
        <Text style={styles.muted}>
          {t('Não foi possível carregar os dados. Tente novamente.')}
        </Text>
      ) : null}

      {followed.length ? (
        <View style={styles.section}>
          <Text accessibilityRole="header" style={styles.heading}>
            {t('Profissionais favoritos')}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 14 }}
          >
            {followed.map((card) => (
              <Link
                key={card.id}
                href={PATHS.professional(card.id) as never}
                accessibilityLabel={card.name}
              >
                <View style={styles.follow}>
                  <Image
                    accessibilityIgnoresInvertColors
                    source={{ uri: card.image }}
                    contentFit="cover"
                    contentPosition={focusPosition(card.imagePosition)}
                    style={styles.avatar}
                  />
                  <Text numberOfLines={1} style={styles.followName}>
                    {card.name}
                  </Text>
                </View>
              </Link>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {environment.features.featuredProfessionals && featured.length ? (
        <View style={styles.section}>
          <Text accessibilityRole="header" style={styles.heading}>
            {t('Profissionais em destaque')}
          </Text>
          {/* A list, not a ScrollView: the photos of each card are a horizontal list too */}
          <FlatList
            horizontal
            data={featured}
            keyExtractor={(card) => card.id}
            renderItem={({ item }) => <FeaturedCard card={item} />}
            showsHorizontalScrollIndicator={false}
            // The cards go to the edges of the screen (the content has 24px on the sides)
            style={styles.bleed}
            contentContainerStyle={{ gap: FEATURED_GAP, paddingHorizontal: 24 }}
          />
        </View>
      ) : null}

      <View style={styles.section}>
        <Text accessibilityRole="header" style={styles.heading}>
          {t('Categorias')}
        </Text>
        <View style={styles.wrapLarge}>
          {INTERESTS.map((interest) => (
            <Chip
              large
              key={interest}
              label={catalogLabel(interest)}
              active={active.includes(interest)}
              onPress={() => toggle(interest)}
            />
          ))}
        </View>
      </View>

      {rows.length ? (
        <View style={styles.section}>
          <Text accessibilityRole="header" style={styles.heading}>
            {t('O que você quer fazer?')}
          </Text>
          {rows.map((row) => (
            <ScrollView
              key={row.category}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.bleed}
              contentContainerStyle={{ gap: 16, paddingHorizontal: 24 }}
            >
              {row.services.map((name) => (
                <Pressable
                  key={name}
                  accessibilityRole="button"
                  accessibilityLabel={catalogLabel(name)}
                  onPress={() =>
                    router.push({
                      pathname: '/explore',
                      params: { service: name, categories: active.join(',') },
                    } as never)
                  }
                  style={styles.service}
                >
                  <View style={[styles.serviceIcon, { backgroundColor: theme.primaryLight }]}>
                    <MaterialIcons
                      name={iconName(SERVICE_ICONS[name] ?? CATEGORY_ICONS[row.category])}
                      size={32}
                      color={theme.primary}
                    />
                  </View>
                  <Text style={[styles.serviceLabel, { color: theme.primary }]}>
                    {catalogLabel(name)}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          ))}
        </View>
      ) : null}

      {nearby.length ? (
        <View style={styles.section}>
          <Text accessibilityRole="header" style={styles.heading}>
            {t('Profissionais próximos')}
          </Text>
          {nearby.map((card) => (
            <NearbyCard key={card.id} card={card} />
          ))}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  logo: { width: 229, height: 42 },
  hero: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  title: { fontSize: 32, fontWeight: '700', color: fixed.ink },
  muted: { color: fixed.gray },
  searchButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: fixed.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: { gap: 20 },
  // Scroll rows go from edge to edge of the screen: cancels the 24px of the screen
  bleed: { marginHorizontal: -24 },
  heading: { fontSize: 20, fontWeight: '700', color: fixed.ink },
  wrapLarge: { flexDirection: 'row', gap: 16, flexWrap: 'wrap' },
  service: { width: 96, alignItems: 'center', gap: 8 },
  serviceIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceLabel: { fontSize: 14, lineHeight: 18, textAlign: 'center' },
  follow: { alignItems: 'center', gap: 4, width: 72 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: fixed.surface },
  followName: { fontSize: 12, color: fixed.ink },
});
