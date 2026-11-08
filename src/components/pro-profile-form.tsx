import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Switch,
  useWindowDimensions,
  View,
} from 'react-native';
import { Text } from './text';
import { useAuth, useAuthActions } from '../contexts/auth';
import { useProfessionals } from '../contexts/professionals';
import { useToast } from '../contexts/toast';
import { t } from '../i18n';
import {
  Availability,
  DEFAULT_AVAILABILITY,
  ImagePosition,
  Professional,
  Service,
  SERVICE_PLACES,
  ServiceMode,
} from '../models/professional';
import {
  connectInstagram,
  disconnectInstagram,
  instagramAvailable,
  refreshInstagram,
} from '../services/instagram';
import { professionalAccounts } from '../services/professional-accounts';
import { placesAvailable } from '../services/places';
import { removePhoto, uploadPhoto } from '../services/photos';
import { fixed, radius } from '../theme/colors';
import { useTheme } from '../theme/theme';
import { formatAddress } from '../utils/address-format';
import { formatCpf, isValidCpf } from '../utils/cpf';
import { APP_LANGUAGE } from '../utils/locale';
import { log } from '../utils/log';
import { formatPhone } from '../utils/phone';
import {
  aboutToParagraphs,
  invalidDayKeys,
  missingFields,
  paragraphsToAbout,
  toAvailabilityDraft,
} from '../utils/profile-form';
import { isServiceComplete, ServiceDraft, toService, toServiceDraft } from '../utils/service-draft';
import { WEEKDAYS } from '../utils/weekdays';
import { AddressField } from './address-field';
import { AvailabilityEditor } from './availability-editor';
import { Button } from './button';
import { FormField, FormSection } from './form-kit';
import { PhotoPositioner } from './photo-positioner';
import { Screen } from './screen';
import { ServicesEditor } from './services-editor';
import { Spinner } from './spinner';

type Position = { lat: number; lng: number };
const NO_POSITION: Position = { lat: 0, lng: 0 };

// What the profile editor holds while the professional edits
type Draft = {
  name: string;
  phone: string;
  image: string;
  imagePosition: ImagePosition;
  gallery: string[];
  address: string;
  serviceMode: ServiceMode | null;
  position: Position;
  // The address only counts once it was found on the map
  addressConfirmed: boolean;
  about: string;
  services: ServiceDraft[];
  availability: Availability;
  visible: boolean;
};

const hasPosition = ({ lat, lng }: Position) => lat !== 0 || lng !== 0;

const draftOf = (profile: Professional): Draft => {
  // Accounts from when there were two photos: the old cover is used when there is no profile photo
  const legacy = profile as Professional & { coverImage?: string; coverPosition?: ImagePosition };
  return {
    name: profile.name,
    phone: profile.phone ? formatPhone(profile.phone) : '',
    image: profile.image || legacy.coverImage || '',
    imagePosition: (profile.image ? profile.imagePosition : legacy.coverPosition) ?? {
      x: 50,
      y: 50,
    },
    gallery: [...profile.gallery],
    address: profile.address,
    // Profiles from before this choice existed work at their address
    serviceMode: profile.serviceMode ?? (profile.address ? 'studio' : null),
    position: { ...profile.position },
    addressConfirmed: hasPosition(profile.position),
    about: paragraphsToAbout(profile.about),
    services: profile.services.map(toServiceDraft),
    availability: toAvailabilityDraft(profile.availability ?? DEFAULT_AVAILABILITY),
    visible: profile.visible !== false,
  };
};

// The editor of the profile of the professional. In the second step of the sign up (`signup`) the profile has to be
// complete to be sent to an admin.
export function ProProfileForm({ signup = false }: { signup?: boolean }) {
  const uid = useAuth().user?.uid ?? '';
  const { byId, status } = useProfessionals();
  const profile = byId(uid);

  // The profile document of a new account shows up in the list a moment after it is created
  if (!profile)
    return status === 'error' ? (
      <Screen>
        <Text>{t('Não foi possível carregar os dados. Tente novamente.')}</Text>
      </Screen>
    ) : (
      <Spinner />
    );
  return <Form profile={profile} signup={signup} />;
}

function Form({ profile, signup }: { profile: Professional; signup: boolean }) {
  const { signOut, finishSignup } = useAuthActions();
  const toast = useToast();
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const uid = profile.id;
  const [draft, setDraft] = useState<Draft>(() => draftOf(profile));
  const [cpf, setCpf] = useState('');
  const [savedCpf, setSavedCpf] = useState('');
  const [tried, setTried] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<'profile' | 'gallery' | 'services' | null>(null);
  const [instagramBusy, setInstagramBusy] = useState(false);
  const [addressError, setAddressError] = useState('');
  const [checkingAddress, setCheckingAddress] = useState(false);
  // Photos that the profile no longer uses: deleted from the storage when it is saved
  const removed = useRef<string[]>([]);

  const set = (patch: Partial<Draft>) => setDraft((current) => ({ ...current, ...patch }));

  // The CPF is private: it is read from its own document, and what was typed before the answer is kept
  useEffect(() => {
    professionalAccounts
      .getCpf(uid)
      .then((value) => {
        setSavedCpf(value);
        setCpf((typed) => typed || formatCpf(value));
      })
      .catch((error) => log.error('Failed to load the CPF', error));
  }, [uid]);

  const needsAddress = draft.serviceMode !== 'home';
  const hasPlace = (place: 'studio' | 'home') =>
    draft.serviceMode === place || draft.serviceMode === 'both';
  // Each place is switched on or off on its own; both on is 'both'
  const togglePlace = (place: 'studio' | 'home') => {
    const studio = hasPlace('studio') !== (place === 'studio');
    const home = hasPlace('home') !== (place === 'home');
    set({ serviceMode: studio && home ? 'both' : studio ? 'studio' : home ? 'home' : null });
  };

  const missing = missingFields({
    name: draft.name,
    cpf,
    image: draft.image,
    hasServiceMode: !!draft.serviceMode,
    needsAddress,
    address: draft.address,
    addressConfirmed: draft.addressConfirmed,
    services: draft.services,
  });
  const invalidDays = invalidDayKeys(
    draft.availability,
    WEEKDAYS.map(({ key }) => key),
  );

  // Picks a photo of the library and uploads it. Returns its address, or null when nothing was picked.
  const pickAndUpload = async (folder: 'profile' | 'gallery' | 'services') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: folder === 'gallery',
    });
    if (result.canceled) return [];
    setUploading(folder);
    try {
      return await Promise.all(result.assets.map((asset) => uploadPhoto(uid, folder, asset)));
    } catch (error) {
      log.error('Upload failed', error);
      toast.show(t('Não foi possível enviar a foto. Use uma imagem e tente novamente.'), 5500);
      return [];
    } finally {
      setUploading(null);
    }
  };

  // What the form writes to the profile
  const fields = (services: Service[]) => ({
    name: draft.name.trim(),
    phone: draft.phone.trim(),
    image: draft.image.trim(),
    imagePosition: draft.imagePosition,
    serviceMode: draft.serviceMode,
    lang: APP_LANGUAGE,
    // Home-only professionals have no address on the map
    address: needsAddress ? draft.address.trim() : '',
    position: needsAddress ? draft.position : NO_POSITION,
    about: aboutToParagraphs(draft.about),
    services,
    tags: [...new Set(services.map((service) => service.category))],
    gallery: draft.gallery,
    availability: {
      slotMinutes: Number(draft.availability.slotMinutes),
      weekly: draft.availability.weekly,
      blockedRanges: draft.availability.blockedRanges,
    },
  });

  // Adding or removing a gallery photo is saved right away, like on the site
  const saveGallery = (gallery: string[]) =>
    professionalAccounts
      .update(uid, { gallery })
      .then(() => toast.show(t('Alterações salvas'), 2500))
      .catch((error) => log.error('Failed to save the gallery', error));

  const addGallery = async () => {
    const urls = await pickAndUpload('gallery');
    if (!urls.length) return;
    const gallery = [...draft.gallery, ...urls];
    set({ gallery });
    void saveGallery(gallery);
  };

  const removeGallery = (url: string) => {
    const gallery = draft.gallery.filter((photo) => photo !== url);
    removed.current.push(url);
    set({ gallery });
    void saveGallery(gallery);
  };

  const changeProfilePhoto = async () => {
    const [url] = await pickAndUpload('profile');
    // A new photo starts centered
    if (url) set({ image: url, imagePosition: { x: 50, y: 50 } });
  };

  // The address has to be one that exists: it is searched and written the way the site writes them
  const confirmAddress = async () => {
    const typed = draft.address.trim();
    if (typed.length < 5) return;
    setCheckingAddress(true);
    setAddressError('');
    try {
      const [found] = await Location.geocodeAsync(typed);
      if (!found) {
        setAddressError(t('Não encontramos esse endereço. Inclua a rua, o número e a cidade.'));
        return;
      }
      const [parts] = await Location.reverseGeocodeAsync(found).catch(() => []);
      set({
        address: formatAddress(typed, parts),
        position: { lat: found.latitude, lng: found.longitude },
        addressConfirmed: true,
      });
    } catch (error) {
      log.warn('Failed to find the address', error);
      setAddressError(t('Não encontramos esse endereço. Inclua a rua, o número e a cidade.'));
    } finally {
      setCheckingAddress(false);
    }
  };

  const save = async () => {
    if (invalidDays.length) {
      toast.show(t('O horário de fechamento precisa ser depois do de abertura.'), 5500);
      return;
    }
    setTried(true);
    if (signup && missing.length) {
      toast.show(
        t('Para enviar o cadastro falta: {{missing}}.', { missing: missing.join(', ') }),
        5500,
      );
      return;
    }
    if (!draft.services.every(isServiceComplete)) {
      toast.show(
        t('Preencha todos os campos obrigatórios dos serviços ou remova os que estiverem vazios.'),
        5500,
      );
      return;
    }

    setSaving(true);
    const services = draft.services.map(toService);
    // Clients only see profiles that are visible and complete
    const published = draft.visible && missing.length === 0;
    try {
      await professionalAccounts.update(uid, {
        ...fields(services),
        visible: draft.visible,
        published,
        // Sign up finished: the account now waits for an admin (a denied sign up is sent again: the denial is cleared)
        ...(signup ? { submitted: true } : {}),
        ...(signup && profile.rejected ? { rejected: false } : {}),
      });
      // Only a valid CPF is saved, and only when it changed
      if (isValidCpf(cpf) && cpf !== savedCpf) {
        await professionalAccounts.saveCpf(uid, cpf);
        setSavedCpf(cpf);
      }
      // Only deletes the removed photos once the profile no longer points to them
      await Promise.all(removed.current.map(removePhoto));
      removed.current = [];
      if (signup) {
        await finishSignup();
        return;
      }
      toast.show(
        published
          ? t('Perfil salvo e publicado! Os clientes já podem encontrar você.')
          : !draft.visible
            ? t(
                'Perfil salvo, mas oculto. Marque "Mostrar meu perfil para os clientes" para publicar.',
              )
            : t('Perfil salvo, mas ainda não publicado. Falta: {{missing}}.', {
                missing: missing.join(', '),
              }),
        5500,
      );
    } catch (error) {
      log.error('Failed to save profile', error);
      toast.show(t('Não foi possível salvar. Tente novamente.'), 5500);
    } finally {
      setSaving(false);
    }
  };

  const instagramAction = async (run: () => Promise<string | null>) => {
    setInstagramBusy(true);
    try {
      const message = await run();
      if (message) toast.show(message, 5500);
    } catch (error) {
      log.error('Instagram failed', error);
      toast.show(t('Não foi possível conectar ao Instagram. Tente novamente.'), 5500);
    } finally {
      setInstagramBusy(false);
    }
  };

  const connect = () =>
    instagramAction(async () => {
      // What was typed is saved first, so nothing is lost on the way back
      await professionalAccounts.update(
        uid,
        fields(draft.services.filter(isServiceComplete).map(toService)),
      );
      const result = await connectInstagram();
      if (!result) return null;
      if (!result.ok) {
        return result.reason === 'invalid-state'
          ? t('A conexão expirou. Tente conectar de novo.')
          : result.reason || t('O acesso não foi autorizado.');
      }
      return t('Instagram conectado: @{{username}}.', { username: result.username });
    });

  const refresh = () =>
    instagramAction(async () => {
      const { photos } = await refreshInstagram();
      return t('Fotos do Instagram atualizadas ({{photos}}).', { photos });
    });

  const disconnect = () =>
    Alert.alert(
      t('Desconectar o Instagram? As fotos importadas deixam de aparecer no seu perfil.'),
      undefined,
      [
        { text: t('Cancelar'), style: 'cancel' },
        {
          text: t('Desconectar'),
          style: 'destructive',
          onPress: () =>
            void instagramAction(async () => {
              await disconnectInstagram();
              return t('Instagram desconectado.');
            }),
        },
      ],
    );

  const photoSize = Math.floor((width - 48 - 24) / 3);

  return (
    <Screen edges={['top']}>
      <Text accessibilityRole="header" style={[styles.title, { color: theme.text }]}>
        {signup ? t('Complete seu cadastro') : t('Meu perfil')}
      </Text>
      {signup ? (
        <Text style={{ color: theme.muted }}>
          {t(
            'Preencha todos os dados abaixo para enviar o cadastro. Depois, ele passa pela aprovação da nossa equipe.',
          )}
        </Text>
      ) : null}
      {signup && profile.rejected ? (
        <Text
          style={[styles.message, { backgroundColor: theme.primaryLight, color: theme.primary }]}
        >
          {t('Seu cadastro anterior não foi aprovado. Revise os dados abaixo e envie novamente.')}
        </Text>
      ) : null}
      {missing.length ? (
        <Text style={styles.notice}>
          {signup
            ? t('Para enviar o cadastro falta: {{missing}}.', { missing: missing.join(', ') })
            : t('Para publicar falta: {{missing}}.', { missing: missing.join(', ') })}
        </Text>
      ) : null}

      <FormSection title={t('Dados')}>
        <FormField label={t('Nome')} value={draft.name} onChangeText={(name) => set({ name })} />
        <FormField
          label="CPF"
          value={cpf}
          onChangeText={(text) => setCpf(formatCpf(text))}
          keyboardType="number-pad"
          placeholder="000.000.000-00"
          error={tried && !isValidCpf(cpf) ? t('Digite um CPF válido.') : undefined}
        />
        <FormField
          label={t('Celular')}
          icon="call"
          value={draft.phone}
          onChangeText={(text) => set({ phone: formatPhone(text) })}
          keyboardType="phone-pad"
        />

        <Text accessibilityRole="header" style={[styles.subheading, { color: theme.text }]}>
          {t('Foto')}
        </Text>
        <Text style={{ color: theme.muted }}>
          {t('Aparece nos cards, no topo da sua página e redonda nas mensagens.')}
        </Text>
        <View style={styles.photoRow}>
          {draft.image ? null : (
            <View style={[styles.preview, styles.empty, { backgroundColor: theme.primaryLight }]}>
              <Text style={{ color: theme.primary, fontSize: 14 }}>{t('Sem foto')}</Text>
            </View>
          )}
          <View style={styles.photoButton}>
            <Button
              variant="outline"
              label={draft.image ? t('Trocar foto') : t('Escolher foto')}
              loading={uploading === 'profile'}
              onPress={() => void changeProfilePhoto()}
            />
          </View>
        </View>
        {draft.image ? (
          <PhotoPositioner
            src={draft.image}
            position={draft.imagePosition}
            onChange={(imagePosition) => set({ imagePosition })}
          />
        ) : null}

        <FormField
          label={t('Sobre você')}
          placeholder={t('Conte sobre o seu trabalho')}
          value={draft.about}
          onChangeText={(about) => set({ about })}
          multiline
        />
      </FormSection>

      <FormSection title="Instagram">
        {!instagramAvailable ? (
          <Text style={{ color: theme.muted }}>
            {t('A conexão com o Instagram ainda não foi configurada.')}
          </Text>
        ) : profile.instagramConnected ? (
          <>
            <Text style={[styles.bold, { color: theme.text }]}>@{profile.instagram}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('Atualizar fotos')}
              accessibilityState={{ disabled: instagramBusy, busy: instagramBusy }}
              disabled={instagramBusy}
              onPress={() => void refresh()}
              style={[styles.pill, styles.brandPill, instagramBusy && styles.off]}
            >
              <Text style={styles.brandPillLabel}>{t('Atualizar fotos')}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('Desconectar')}
              accessibilityState={{ disabled: instagramBusy }}
              disabled={instagramBusy}
              onPress={disconnect}
              style={[styles.pill, styles.dangerPill, instagramBusy && styles.off]}
            >
              <Text style={styles.dangerLabel}>{t('Desconectar')}</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={{ color: theme.muted }}>
              {t(
                'Conecte a sua conta para mostrar as 12 fotos mais recentes do seu Instagram no perfil. A conta precisa ser profissional (Criador ou Empresa): conta pessoal não funciona. Para mudar, no Instagram vá em Configurações > Tipo de conta e ferramentas > Mudar para conta profissional.',
              )}
            </Text>
            <InstagramButton
              label={t('Conectar Instagram')}
              busy={instagramBusy}
              onPress={() => void connect()}
            />
          </>
        )}
      </FormSection>

      <FormSection
        title={t('Galeria')}
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('Adicionar fotos')}
            accessibilityState={{ busy: uploading === 'gallery' }}
            disabled={uploading === 'gallery'}
            onPress={() => void addGallery()}
            hitSlop={8}
          >
            {uploading === 'gallery' ? (
              <ActivityIndicator color={theme.primary} />
            ) : (
              <Text style={{ color: theme.primary, fontSize: 16 }}>+ {t('Adicionar fotos')}</Text>
            )}
          </Pressable>
        }
      >
        {draft.gallery.length ? (
          <View style={styles.gallery}>
            {draft.gallery.map((photo) => (
              <View key={photo} style={{ width: photoSize, height: photoSize }}>
                <Image
                  accessibilityIgnoresInvertColors
                  source={{ uri: photo }}
                  contentFit="cover"
                  style={styles.thumb}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('Remover foto')}
                  hitSlop={6}
                  onPress={() => removeGallery(photo)}
                  style={styles.remove}
                >
                  <MaterialIcons name="close" size={16} color={fixed.white} />
                </Pressable>
              </View>
            ))}
          </View>
        ) : (
          <Text style={{ color: theme.muted }}>
            {t('Mostre o seu trabalho: as fotos aparecem na galeria do seu perfil.')}
          </Text>
        )}
      </FormSection>

      <FormSection title={t('Localização')}>
        <Text style={{ color: theme.muted }}>{t('Onde você atende? Pode escolher os dois.')}</Text>
        <View
          style={styles.modes}
          accessibilityRole="radiogroup"
          accessibilityLabel={t('Onde você atende?')}
        >
          {SERVICE_PLACES.map(({ key, label }) => {
            const on = hasPlace(key);
            return (
              <Pressable
                key={key}
                accessibilityRole="button"
                accessibilityLabel={label}
                accessibilityState={{ selected: on }}
                onPress={() => togglePlace(key)}
                style={[
                  styles.mode,
                  { borderColor: on ? theme.primary : theme.muted },
                  on && { backgroundColor: theme.selectedBg },
                ]}
              >
                <Text style={{ color: on ? theme.selectedFg : theme.text, fontWeight: '500' }}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {needsAddress && draft.serviceMode ? (
          <>
            <AddressField
              variant="form"
              label={t('Endereço')}
              placeholder={t('Rua, número, bairro e cidade')}
              value={draft.address}
              onChangeText={(address) => {
                set({ address, addressConfirmed: false, position: NO_POSITION });
                setAddressError('');
              }}
              // A suggestion of Google was chosen: the address is written as Google writes it, and has a place
              onPlace={(place) => {
                set({ address: place.address, position: place.position, addressConfirmed: true });
                setAddressError('');
              }}
              confirmed={draft.addressConfirmed}
              error={addressError || undefined}
            />
            {/* Without a Google key there are no suggestions: the address is confirmed with the geocoder of the phone */}
            {!placesAvailable() && !draft.addressConfirmed ? (
              <Button
                variant="outline"
                label={t('Confirmar endereço')}
                loading={checkingAddress}
                onPress={() => void confirmAddress()}
                disabled={draft.address.trim().length < 5}
              />
            ) : null}
          </>
        ) : null}
      </FormSection>

      <ServicesEditor
        services={draft.services}
        onChange={(services) => set({ services })}
        tried={tried}
        uploading={uploading === 'services'}
        onAddPhoto={async () => (await pickAndUpload('services'))[0] ?? null}
        onDiscard={(urls) => removed.current.push(...urls)}
      />

      <AvailabilityEditor
        availability={draft.availability}
        onChange={(availability) => set({ availability })}
      />

      {!signup ? (
        <View style={styles.between}>
          <Text style={[styles.bold, styles.flex, { color: theme.text }]}>
            {t('Mostrar meu perfil para os clientes')}
          </Text>
          <Switch
            accessibilityLabel={t('Mostrar meu perfil para os clientes')}
            value={draft.visible}
            onValueChange={(visible) => set({ visible })}
            trackColor={{ true: fixed.accent }}
          />
        </View>
      ) : null}

      {!signup && !missing.length && !draft.visible ? (
        <Text style={{ color: theme.muted }}>
          {t('Seu perfil está completo, mas oculto para os clientes.')}
        </Text>
      ) : null}

      <View style={styles.submit}>
        <Button
          label={signup ? t('Enviar cadastro') : t('Salvar perfil')}
          onPress={() => void save()}
          loading={saving}
        />
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('Sair')}
        onPress={() => void signOut()}
        style={[styles.pill, styles.dangerPill]}
      >
        <Text style={styles.dangerLabel}>{t('Sair')}</Text>
      </Pressable>
    </Screen>
  );
}

// "Conectar Instagram": the colors of Instagram (the site has a gradient; here the pink of its middle, flat)
function InstagramButton({
  label,
  busy,
  onPress,
}: {
  label: string;
  busy: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: busy, busy }}
      disabled={busy}
      onPress={onPress}
      style={[styles.pill, styles.instagram, busy && styles.off]}
    >
      <Ionicons name="logo-instagram" size={24} color={fixed.white} />
      <Text style={styles.instagramLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '700' },
  message: { padding: 14, borderRadius: 12, overflow: 'hidden' },
  subheading: { fontSize: 16, fontWeight: '700', marginTop: 8 },
  bold: { fontWeight: '700' },
  flex: { flex: 1 },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  ok: { fontWeight: '600' },
  // What is missing to send or publish: a see-through dark box, like the one that floats on the site
  notice: {
    padding: 14,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(55, 69, 85, 0.9)',
    color: fixed.white,
  },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  preview: { width: 128, height: 128, borderRadius: 64 },
  empty: { alignItems: 'center', justifyContent: 'center' },
  photoButton: { flex: 1 },
  gallery: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  thumb: { flex: 1, borderRadius: 12, backgroundColor: fixed.surface },
  remove: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  mode: {
    paddingHorizontal: 20,
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: 1.5,
  },
  pill: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: radius.pill,
  },
  brandPill: { borderWidth: 1.5, borderColor: fixed.brand, backgroundColor: fixed.white },
  brandPillLabel: { fontSize: 16, color: fixed.brand },
  dangerPill: { borderWidth: 1.5, borderColor: fixed.dangerStrong, backgroundColor: fixed.white },
  dangerLabel: { fontSize: 16, color: fixed.dangerStrong },
  // The gradient of the site (45deg, orange to blue)
  instagram: {
    experimental_backgroundImage: `linear-gradient(45deg, ${fixed.instagram.orange}, ${fixed.instagram.pink} 45%, ${fixed.instagram.purple} 75%, ${fixed.instagram.blue})`,
  },
  instagramLabel: { fontSize: 16, fontWeight: '700', color: fixed.white },
  off: { opacity: 0.5 },
  submit: { marginTop: 8 },
});
