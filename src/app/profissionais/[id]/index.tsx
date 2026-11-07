import { MaterialIcons } from '@expo/vector-icons';
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
import { Button } from '../../../components/button';
import { HeartButton } from '../../../components/heart-button';
import { PhotoPager } from '../../../components/photo-pager';
import { Rating } from '../../../components/rating';
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
import { catalogLabel } from '../../../utils/catalog';
import { formatPrice, roundMoney } from '../../../utils/money';
import { workingHours } from '../../../utils/hours';
import { instagramUrl } from '../../../utils/instagram';
import { viewsLabel } from '../../../utils/labels';
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
  const about = aboutOpen ? artist.about : artist.about.slice(0, 1);

  const copyAddress = async () => {
    await Clipboard.setStringAsync(artist.address);
    toast.show(t('Endereço copiado'), 2000);
  };

  return (
    <Screen scroll={false} padded={false} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View>
          <PhotoPager
            photos={photos}
            focusPhoto={artist.image}
            focus={artist.imagePosition}
            width={width}
            height={Math.round(width * 0.85)}
            label={artist.name}
          />
          <View style={styles.back}>
            <BackButton />
          </View>
          <HeartButton professionalId={artist.id} />
        </View>

        <View style={styles.body}>
          <Text accessibilityRole="header" style={styles.name}>
            {artist.name}
          </Text>

          {artist.serviceMode === 'home' ? (
            <Text style={styles.muted}>{t('Atendimento a domicílio')}</Text>
          ) : artist.address ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('Copiar endereço')}
              onPress={() => void copyAddress()}
              style={styles.address}
            >
              <Text style={[styles.muted, styles.addressText]}>
                {localizeAddress(artist.address)}
              </Text>
              <MaterialIcons name="content-copy" size={18} color={fixed.gray} />
            </Pressable>
          ) : null}
          {auth.role !== 'professional' ? (
            <Link
              href={`/mensagens/${artist.id}` as never}
              accessibilityRole="link"
              accessibilityLabel={t('Conversar com {{name}}', { name: artist.name })}
              style={styles.chat}
            >
              {t('Conversar')}
            </Link>
          ) : null}
          {artist.serviceMode === 'both' ? (
            <Text style={styles.muted}>{t('Também atende a domicílio')}</Text>
          ) : null}

          <View style={styles.row}>
            <Rating rating={artist.rating} count={artist.reviewsCount} />
            <Text style={styles.muted}>
              · {artist.views} {viewsLabel(artist.views)}
            </Text>
          </View>

          {artist.instagram ? (
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={`Instagram @${artist.instagram}`}
              onPress={() => void Linking.openURL(instagramUrl(artist.instagram!))}
            >
              <Text style={styles.link}>@{artist.instagram}</Text>
            </Pressable>
          ) : null}

          {artist.about.length ? (
            <View style={styles.section}>
              <Text accessibilityRole="header" style={styles.heading}>
                {t('Sobre')}
              </Text>
              {about.map((paragraph, n) => (
                <Text key={n} style={styles.muted}>
                  {paragraph}
                </Text>
              ))}
              {artist.about.length > 1 ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={aboutOpen ? t('Ler menos') : t('Ler mais')}
                  onPress={() => setAboutOpen((open) => !open)}
                >
                  <Text style={styles.link}>{aboutOpen ? t('Ler menos') : t('Ler mais')}</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {hours.length ? (
            <View style={styles.section}>
              <Text accessibilityRole="header" style={styles.heading}>
                {t('Horário de funcionamento')}
              </Text>
              {hours.map((line) => (
                <View key={line.days} style={styles.hours}>
                  <Text style={styles.muted}>{line.days}</Text>
                  <Text style={styles.bold}>{line.hours}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {artist.services.length ? (
            <View style={styles.section}>
              <Text accessibilityRole="header" style={styles.heading}>
                {t('Nossos serviços')}
              </Text>
              {available.length > 1 ? (
                <View style={styles.row}>
                  {available.map((category) => (
                    <Pressable
                      key={category}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active.includes(category) }}
                      accessibilityLabel={catalogLabel(category)}
                      onPress={() => toggleCategory(category)}
                      style={[styles.tab, active.includes(category) && styles.tabOn]}
                    >
                      <MaterialIcons
                        name={category === 'Maquiagem' ? 'brush' : 'content-cut'}
                        size={18}
                        color={active.includes(category) ? fixed.white : fixed.ink}
                      />
                      <Text style={{ color: active.includes(category) ? fixed.white : fixed.ink }}>
                        {catalogLabel(category)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
              {services.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  selected={picked.includes(service.id)}
                  onToggle={canBook || !auth.user ? () => togglePicked(service.id) : undefined}
                />
              ))}
            </View>
          ) : null}

          {artist.instagramPhotos?.length ? (
            <View style={styles.section}>
              <Text accessibilityRole="header" style={styles.heading}>
                Instagram
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
              >
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
                      style={styles.insta}
                      contentFit="cover"
                    />
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ) : null}

          <ReviewsSection professionalId={artist.id} />

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
        </View>
      </ScrollView>
      {selected.length ? (
        <View style={styles.bar}>
          <View>
            <Text style={styles.bold}>
              {t('Total')} ({selected.length} {selected.length === 1 ? t('serviço') : t('serviços')}
              )
            </Text>
            <Text style={styles.barPrice}>{formatPrice(total)}</Text>
          </View>
          <View style={{ minWidth: 140 }}>
            <Button
              label={t('Agendar')}
              onPress={() =>
                router.push({
                  pathname: '/profissionais/[id]/agendar',
                  params: { id: artist.id, servicos: picked.join(',') },
                } as never)
              }
            />
          </View>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 48 },
  back: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: fixed.white,
  },
  body: { padding: 16, gap: 10 },
  name: { fontSize: 26, fontWeight: '700', color: fixed.ink },
  muted: { color: fixed.gray },
  bold: { fontWeight: '700', color: fixed.ink },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  address: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  addressText: { flexShrink: 1 },
  link: { color: fixed.accentText, fontWeight: '600', paddingVertical: 4 },
  section: { gap: 8, marginTop: 8 },
  heading: { fontSize: 20, fontWeight: '700', color: fixed.ink },
  hours: { flexDirection: 'row', justifyContent: 'space-between' },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: fixed.border,
  },
  tabOn: { backgroundColor: fixed.brand, borderColor: fixed.brand },
  insta: { width: 120, height: 120, borderRadius: 10, backgroundColor: fixed.surface },
  notice: {
    backgroundColor: fixed.warningBg,
    color: fixed.warning,
    padding: 14,
    borderRadius: 12,
    overflow: 'hidden',
    fontWeight: '600',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: fixed.borderSoft,
    backgroundColor: fixed.white,
  },
  barPrice: { fontSize: 20, fontWeight: '700', color: fixed.ink },
  chat: { color: fixed.accentText, fontWeight: '600', paddingVertical: 4 },
  notFound: { color: fixed.gray, textAlign: 'center', marginTop: 40 },
});
