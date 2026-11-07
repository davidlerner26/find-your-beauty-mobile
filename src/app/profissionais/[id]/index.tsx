import { Feather, MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Link } from '../../../components/link';
import { useEffect, useMemo, useState } from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { Text } from '../../../components/text';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HeartButton } from '../../../components/heart-button';
import { PhotoPager } from '../../../components/photo-pager';
import { ReviewsSection } from '../../../components/reviews-section';
import { Screen } from '../../../components/screen';
import { ServiceCard } from '../../../components/service-card';
import { Spinner } from '../../../components/spinner';
import { BackButton } from '../../../components/back-button';
import { useAuth } from '../../../contexts/auth';
import { useProfessionals } from '../../../contexts/professionals';
import { useToast } from '../../../contexts/toast';
import { t } from '../../../i18n';
import { DEFAULT_AVAILABILITY, Professional, ServiceCategory } from '../../../models/professional';
import { missingProfileData } from '../../../models/user';
import { registerView } from '../../../services/profile-views';
import { users } from '../../../services/users';
import { fixed } from '../../../theme/colors';
import { useTheme } from '../../../theme/theme';
import { catalogLabel } from '../../../utils/catalog';
import { formatPrice, roundMoney } from '../../../utils/money';
import { workingHours } from '../../../utils/hours';
import { instagramUrl } from '../../../utils/instagram';
import { reviewsLabel, viewsLabel } from '../../../utils/labels';
import { localizeAddress } from '../../../utils/address';
import { log } from '../../../utils/log';
import { PATHS } from '../../../utils/paths';

const CATEGORIES: ServiceCategory[] = ['Maquiagem', 'Cabelo'];

export default function ProfessionalPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { status, byId } = useProfessionals();
  const artist = byId(id);

  if (status === 'loading') return <Spinner />;
  if (!artist || artist.published === false) {
    return (
      <Screen>
        <BackButton />
        <Text style={styles.notFound}>{t('Profissional não encontrado.')}</Text>
      </Screen>
    );
  }
  return <Details artist={artist} />;
}

function Details({ artist }: { artist: Professional }) {
  const auth = useAuth();
  const toast = useToast();
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [aboutOpen, setAboutOpen] = useState(false);
  const [chosen, setChosen] = useState<ServiceCategory[]>([]);
  // The services the client picked to book
  const [picked, setPicked] = useState<string[]>([]);
  // What is missing on the profile of the client for booking (empty: nothing)
  const [missing, setMissing] = useState<string[]>([]);

  // A visit to a professional that clients can see (the server ignores their own visits)
  useEffect(() => {
    if (artist.published) void registerView(artist.id);
  }, [artist.id, artist.published]);

  const uid = auth.user?.uid;
  const isClient = auth.role === 'client';
  useEffect(() => {
    if (!uid || !isClient) return;
    users
      .get(uid)
      .then((profile) => setMissing(missingProfileData(profile)))
      .catch((error) => log.error('Failed to check the profile data', error));
  }, [uid, isClient]);

  const available = CATEGORIES.filter((category) =>
    artist.services.some((service) => service.category === category),
  );
  // The chosen categories (one or both), or the first one that has services
  const active = useMemo(() => {
    const valid = chosen.filter((name) => available.includes(name));
    return valid.length ? valid : available.slice(0, 1);
  }, [chosen, available]);

  // Each button turns a category on or off; at least one stays on
  const toggleCategory = (name: ServiceCategory) => {
    if (!active.includes(name)) setChosen([...active, name]);
    else if (active.length > 1) setChosen(active.filter((n) => n !== name));
  };

  const photos = artist.gallery?.length ? artist.gallery : [artist.image];
  const hours = workingHours(artist.availability ?? DEFAULT_AVAILABILITY);
  const services = artist.services.filter((service) => active.includes(service.category));
  const selected = artist.services.filter((service) => picked.includes(service.id));
  const total = roundMoney(selected.reduce((sum, service) => sum + service.price, 0));
  const togglePicked = (id: string) =>
    setPicked((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    );
  const canBook = isClient && !missing.length;
  const canBookNow = !!auth.user && canBook && selected.length > 0;
  // Collapsed: only the first paragraph, cut in 3 lines
  const about = aboutOpen ? artist.about : artist.about.slice(0, 1);
  const gap = (width - 48 - 3 * 8) / 3;

  const openChat = () => router.push(`/mensagens/${artist.id}` as never);

  const copyAddress = async () => {
    await Clipboard.setStringAsync(artist.address);
    toast.show(t('Endereço copiado'), 2000);
  };

  return (
    <Screen scroll={false} padded={false} edges={[]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View>
          <PhotoPager
            photos={photos}
            focusPhoto={artist.image}
            focus={artist.imagePosition}
            width={width}
            height={320 + insets.top}
            label={artist.name}
          />
          <View style={[styles.back, { top: insets.top + 12 }]}>
            <BackButton />
          </View>
          <View style={[styles.actions, { top: insets.top + 12 }]}>
            <HeartButton professionalId={artist.id} large style={styles.heart} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('Ver no mapa')}
              onPress={() =>
                router.push({ pathname: PATHS.explore, params: { focus: artist.id } } as never)
              }
              style={styles.round}
            >
              <MaterialIcons name="map" size={26} color={theme.primary} />
            </Pressable>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.intro}>
            <View style={styles.nameRow}>
              <Text accessibilityRole="header" style={styles.name}>
                {artist.name}
              </Text>
              {auth.role !== 'professional' ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('Conversar com {{name}}', { name: artist.name })}
                  onPress={openChat}
                  style={[styles.chatIcon, { backgroundColor: theme.primaryLight }]}
                >
                  <MaterialIcons name="chat-bubble" size={22} color={theme.primary} />
                </Pressable>
              ) : null}
            </View>

            {artist.serviceMode === 'home' ? (
              <Text style={styles.muted}>{t('Atendimento a domicílio')}</Text>
            ) : artist.address ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('Copiar endereço')}
                onPress={() => void copyAddress()}
              >
                <Text style={styles.muted}>
                  {localizeAddress(artist.address)}{' '}
                  <MaterialIcons name="content-copy" size={16} color={theme.primary} />
                </Text>
              </Pressable>
            ) : null}
            {artist.serviceMode === 'both' ? (
              <Text style={styles.muted}>{t('Também atende a domicílio')}</Text>
            ) : null}

            {artist.instagram ? (
              <Pressable
                accessibilityRole="link"
                accessibilityLabel={`Instagram @${artist.instagram}`}
                onPress={() => void Linking.openURL(instagramUrl(artist.instagram!))}
                style={styles.instagram}
              >
                <Feather name="instagram" size={19} color={theme.primary} />
                <Text style={[styles.instagramText, { color: theme.primary }]}>
                  @{artist.instagram}
                </Text>
              </Pressable>
            ) : null}

            <View style={styles.facts}>
              <View style={styles.fact}>
                <MaterialIcons name="schedule" size={22} color={theme.primary} />
                <Text>{t('Aberto hoje')}</Text>
              </View>
              <View style={styles.fact}>
                <MaterialIcons name="visibility" size={22} color={theme.primary} />
                <Text>
                  {artist.views} {viewsLabel(artist.views)}
                </Text>
              </View>
              <View
                style={styles.fact}
                accessible
                accessibilityLabel={`${artist.rating} ${t('estrelas')}, ${artist.reviewsCount} ${reviewsLabel(artist.reviewsCount)}`}
              >
                <MaterialIcons name="star" size={22} color={fixed.accent} />
                <Text>
                  <Text style={styles.bold}>{artist.rating}</Text> ({artist.reviewsCount}{' '}
                  {reviewsLabel(artist.reviewsCount)})
                </Text>
              </View>
            </View>
          </View>

          {artist.about.length ? (
            <View style={styles.section}>
              <Text accessibilityRole="header" style={styles.heading}>
                {t('Sobre')}
              </Text>
              {about.map((paragraph, n) => (
                <Text key={n} style={styles.muted} numberOfLines={aboutOpen ? undefined : 3}>
                  {paragraph}
                </Text>
              ))}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={aboutOpen ? t('Ler menos') : t('Ler mais')}
                onPress={() => setAboutOpen((open) => !open)}
              >
                <Text style={[styles.link, { color: theme.primary }]}>
                  {aboutOpen ? t('Ler menos') : t('Ler mais')}
                </Text>
              </Pressable>
            </View>
          ) : null}

          {hours.length ? (
            <View style={styles.section}>
              <Text accessibilityRole="header" style={styles.heading}>
                {t('Horário de funcionamento')}
              </Text>
              <View style={styles.hours}>
                {hours.map((line) => (
                  <View key={line.days} style={{ gap: 6 }}>
                    <Text style={styles.muted}>{line.days}</Text>
                    <Text style={styles.hoursText}>{line.hours}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {artist.services.length ? (
            <View style={styles.section}>
              <Text accessibilityRole="header" style={styles.heading}>
                {t('Nossos serviços')}
              </Text>
              {available.length > 1 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.bleed}
                  contentContainerStyle={styles.categories}
                >
                  {available.map((category) => {
                    const on = active.includes(category);
                    return (
                      <Pressable
                        key={category}
                        accessibilityRole="button"
                        accessibilityState={{ selected: on }}
                        accessibilityLabel={catalogLabel(category)}
                        onPress={() => toggleCategory(category)}
                        style={[
                          styles.category,
                          on && { backgroundColor: theme.primaryLight, borderColor: theme.primary },
                        ]}
                      >
                        <MaterialIcons
                          name={category === 'Maquiagem' ? 'brush' : 'content-cut'}
                          size={24}
                          color={on ? theme.primary : fixed.ink}
                        />
                        <Text style={{ color: on ? theme.primary : fixed.ink }}>
                          {catalogLabel(category)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              ) : null}
              <View style={styles.services}>
                {services.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    selected={picked.includes(service.id)}
                    onToggle={canBook || !auth.user ? () => togglePicked(service.id) : undefined}
                  />
                ))}
              </View>
            </View>
          ) : null}

          {artist.instagramPhotos?.length ? (
            <View style={styles.section}>
              <View style={styles.sectionHead}>
                <Text accessibilityRole="header" style={styles.heading}>
                  Instagram
                </Text>
                {artist.instagram ? (
                  <Pressable
                    accessibilityRole="link"
                    accessibilityLabel={`Instagram @${artist.instagram}`}
                    onPress={() => void Linking.openURL(instagramUrl(artist.instagram!))}
                  >
                    <Text style={{ color: theme.primary }}>@{artist.instagram}</Text>
                  </Pressable>
                ) : null}
              </View>
              <View style={styles.gallery}>
                {artist.instagramPhotos.map((photo) => (
                  <Pressable
                    key={photo.id}
                    accessibilityRole="link"
                    accessibilityLabel={t('Foto do Instagram de {{name}}', { name: artist.name })}
                    onPress={() => void Linking.openURL(photo.permalink)}
                  >
                    <Image
                      accessibilityIgnoresInvertColors
                      source={{ uri: photo.url }}
                      style={{ width: gap, height: gap, ...styles.insta }}
                      contentFit="cover"
                    />
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          <ReviewsSection professionalId={artist.id} />
        </View>
      </ScrollView>

      <View style={[styles.bar, { paddingBottom: 16 + insets.bottom }]}>
        {auth.ready && !auth.user ? (
          <Link href={PATHS.login as never} style={styles.notice} accessibilityRole="link">
            {t('Entre na sua conta para agendar.')}
          </Link>
        ) : missing.length ? (
          <Link href={'/perfil' as never} style={styles.notice} accessibilityRole="link">
            {t('Complete seus dados no perfil para agendar. Falta: {{missing}}.', {
              missing: missing.join(', '),
            })}
          </Link>
        ) : null}
        <View style={styles.barRow}>
          <View>
            <Text>
              <Text style={styles.bold}>{t('Total')}</Text> ({selected.length}{' '}
              {selected.length === 1 ? t('serviço') : t('serviços')})
            </Text>
            <Text style={styles.barPrice}>{formatPrice(total)}</Text>
          </View>
          <View style={styles.barActions}>
            {auth.role !== 'professional' ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('Conversar com {{name}}', { name: artist.name })}
                onPress={openChat}
                style={[styles.chatButton, { borderColor: theme.primary }]}
              >
                <MaterialIcons name="chat-bubble" size={22} color={theme.primary} />
              </Pressable>
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('Agendar')}
              accessibilityState={{ disabled: !canBookNow }}
              disabled={!canBookNow}
              onPress={() =>
                router.push({
                  pathname: '/profissionais/[id]/agendar',
                  params: { id: artist.id, servicos: picked.join(',') },
                } as never)
              }
              style={[
                styles.book,
                { backgroundColor: theme.primary },
                !canBookNow && { opacity: 0.5 },
              ]}
            >
              <MaterialIcons name="calendar-today" size={26} color={theme.onPrimary} />
            </Pressable>
          </View>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 24 },
  back: {
    position: 'absolute',
    left: 24,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: { position: 'absolute', right: 24, flexDirection: 'row', gap: 16 },
  // The heart sits in the row of the buttons, not on the corner of the photo
  heart: { position: 'relative', top: 0, right: 0 },
  round: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { paddingHorizontal: 24 },
  intro: { paddingVertical: 24, gap: 6 },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  name: { flex: 1, fontSize: 30, fontWeight: '700', color: fixed.ink },
  chatIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  muted: { color: fixed.gray },
  bold: { fontWeight: '700', color: fixed.ink },
  instagram: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  instagramText: { fontWeight: '600' },
  facts: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 40, rowGap: 16, marginTop: 14 },
  fact: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  section: { gap: 16, marginBottom: 40 },
  sectionHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  heading: { fontSize: 20, fontWeight: '700', color: fixed.ink },
  link: { fontSize: 16 },
  hours: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 64, rowGap: 16 },
  hoursText: { fontSize: 18, fontWeight: '700', color: fixed.ink },
  // Rows that go from edge to edge of the screen (the content has 24px on the sides)
  bleed: { marginHorizontal: -24 },
  categories: { gap: 16, paddingHorizontal: 24 },
  category: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 48,
    paddingHorizontal: 28,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: fixed.border,
    backgroundColor: fixed.white,
  },
  services: { gap: 20 },
  gallery: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  insta: { borderRadius: 12, backgroundColor: fixed.surface },
  notice: {
    backgroundColor: fixed.dangerBg,
    color: '#b42318',
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    fontSize: 14,
  },
  bar: {
    paddingTop: 16,
    paddingHorizontal: 24,
    backgroundColor: fixed.white,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -6 },
    elevation: 12,
  },
  barRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  barPrice: { fontSize: 24, fontWeight: '700', color: fixed.ink },
  barActions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  chatButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    backgroundColor: fixed.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  book: {
    minWidth: 144,
    height: 52,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFound: { color: fixed.gray, textAlign: 'center', marginTop: 40 },
});
