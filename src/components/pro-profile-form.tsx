import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, View } from 'react-native';
import { Text, TextInput } from './text';
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
import { removePhoto, uploadPhoto } from '../services/photos';
import { fixed } from '../theme/colors';
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
import { AvailabilityEditor } from './availability-editor';
import { Button } from './button';
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

  return (
    <Screen edges={['top']}>
      <Text accessibilityRole="header" style={styles.title}>
        {signup ? t('Complete o seu perfil') : t('Perfil')}
      </Text>
      {signup ? (
        <Text style={styles.muted}>
          {t(
            'Preencha os dados abaixo. Depois do envio, o cadastro é analisado antes de entrar no ar.',
          )}
        </Text>
      ) : null}
      {missing.length ? (
        <Text style={styles.notice}>
          {signup
            ? t('Para enviar o cadastro falta: {{missing}}.', { missing: missing.join(', ') })
            : t('Para publicar falta: {{missing}}.', { missing: missing.join(', ') })}
        </Text>
      ) : null}

      <Text accessibilityRole="header" style={styles.heading}>
        {t('Dados')}
      </Text>
      <Labeled label={t('Nome')}>
        <TextInput
          accessibilityLabel={t('Nome')}
          value={draft.name}
          onChangeText={(name) => set({ name })}
          style={styles.input}
        />
      </Labeled>
      <Labeled
        label="CPF"
        error={tried && !isValidCpf(cpf) ? t('Digite um CPF válido.') : undefined}
      >
        <TextInput
          accessibilityLabel="CPF"
          value={cpf}
          onChangeText={(text) => setCpf(formatCpf(text))}
          keyboardType="number-pad"
          style={styles.input}
        />
      </Labeled>
      <Labeled label={t('Celular')}>
        <TextInput
          accessibilityLabel={t('Celular')}
          value={draft.phone}
          onChangeText={(text) => set({ phone: formatPhone(text) })}
          keyboardType="phone-pad"
          style={styles.input}
        />
      </Labeled>

      <Text accessibilityRole="header" style={styles.subheading}>
        {t('Foto')}
      </Text>
      <Text style={styles.muted}>
        {t('É a sua foto nos cartões, no topo do perfil e nas mensagens.')}
      </Text>
      {draft.image ? (
        <Image
          accessibilityIgnoresInvertColors
          source={{ uri: draft.image }}
          contentFit="cover"
          style={styles.preview}
        />
      ) : (
        <View style={[styles.preview, styles.empty]}>
          <Text style={styles.muted}>{t('Sem foto')}</Text>
        </View>
      )}
      <Button
        variant="outline"
        label={draft.image ? t('Trocar foto') : t('Escolher foto')}
        loading={uploading === 'profile'}
        onPress={() => void changeProfilePhoto()}
      />

      <Labeled label={t('Sobre você')}>
        <TextInput
          accessibilityLabel={t('Sobre você')}
          placeholder={t(
            'Conte a sua experiência. Deixe uma linha em branco para separar parágrafos.',
          )}
          placeholderTextColor={fixed.gray}
          value={draft.about}
          onChangeText={(about) => set({ about })}
          multiline
          style={[styles.input, styles.multiline]}
        />
      </Labeled>

      <Text accessibilityRole="header" style={styles.heading}>
        Instagram
      </Text>
      {!instagramAvailable ? (
        <Text style={styles.muted}>
          {t('A conexão com o Instagram ainda não foi configurada.')}
        </Text>
      ) : profile.instagramConnected ? (
        <>
          <Text style={styles.bold}>@{profile.instagram}</Text>
          <Button
            variant="outline"
            label={t('Atualizar fotos')}
            loading={instagramBusy}
            onPress={() => void refresh()}
          />
          <Button variant="link" label={t('Desconectar')} onPress={disconnect} />
        </>
      ) : (
        <>
          <Text style={styles.muted}>
            {t(
              'Conecte a conta profissional do Instagram para mostrar suas fotos mais recentes no perfil.',
            )}
          </Text>
          <Button
            variant="outline"
            label={t('Conectar Instagram')}
            loading={instagramBusy}
            onPress={() => void connect()}
          />
        </>
      )}

      <Text accessibilityRole="header" style={styles.heading}>
        {t('Galeria')}
      </Text>
      <View style={styles.wrap}>
        {draft.gallery.map((photo) => (
          <Pressable
            key={photo}
            accessibilityRole="button"
            accessibilityLabel={t('Remover foto')}
            onPress={() => removeGallery(photo)}
          >
            <Image
              accessibilityIgnoresInvertColors
              source={{ uri: photo }}
              contentFit="cover"
              style={styles.thumb}
            />
          </Pressable>
        ))}
      </View>
      <Button
        variant="outline"
        label={t('Adicionar fotos')}
        loading={uploading === 'gallery'}
        onPress={() => void addGallery()}
      />
      <Text style={styles.muted}>{t('Toque numa foto para removê-la.')}</Text>

      <Text accessibilityRole="header" style={styles.heading}>
        {t('Localização')}
      </Text>
      <Text style={styles.muted}>{t('Onde você atende? Pode escolher os dois.')}</Text>
      {SERVICE_PLACES.map(({ key, label }) => (
        <View key={key} style={styles.between}>
          <Text style={styles.bold}>{label}</Text>
          <Switch
            accessibilityLabel={label}
            value={hasPlace(key)}
            onValueChange={() => togglePlace(key)}
            trackColor={{ true: fixed.brand }}
          />
        </View>
      ))}
      {needsAddress && draft.serviceMode ? (
        <>
          <Labeled label={t('Endereço')} error={addressError || undefined}>
            <TextInput
              accessibilityLabel={t('Endereço')}
              placeholder={t('Rua, número, bairro e cidade')}
              placeholderTextColor={fixed.gray}
              value={draft.address}
              onChangeText={(address) => {
                set({ address, addressConfirmed: false, position: NO_POSITION });
                setAddressError('');
              }}
              style={styles.input}
            />
          </Labeled>
          {draft.addressConfirmed ? (
            <Text style={styles.ok}>✓ {t('Endereço confirmado.')}</Text>
          ) : (
            <Button
              variant="outline"
              label={t('Confirmar endereço')}
              loading={checkingAddress}
              onPress={() => void confirmAddress()}
              disabled={draft.address.trim().length < 5}
            />
          )}
        </>
      ) : null}

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
          <Text style={[styles.bold, styles.flex]}>{t('Mostrar meu perfil para os clientes')}</Text>
          <Switch
            accessibilityLabel={t('Mostrar meu perfil para os clientes')}
            value={draft.visible}
            onValueChange={(visible) => set({ visible })}
            trackColor={{ true: fixed.brand }}
          />
        </View>
      ) : null}

      <Button
        label={signup ? t('Enviar cadastro') : t('Salvar')}
        onPress={() => void save()}
        loading={saving}
      />
      <Button variant="outline" label={t('Sair')} onPress={() => void signOut()} />
    </Screen>
  );
}

function Labeled({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '700', color: fixed.ink },
  heading: { fontSize: 20, fontWeight: '700', color: fixed.ink, marginTop: 8 },
  subheading: { fontSize: 16, fontWeight: '700', color: fixed.ink },
  field: { gap: 6 },
  label: { fontWeight: '600', color: fixed.ink },
  input: {
    minHeight: 46,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: fixed.border,
    borderRadius: 12,
    fontSize: 16,
    color: fixed.ink,
  },
  multiline: { minHeight: 110, textAlignVertical: 'top', paddingTop: 12 },
  muted: { color: fixed.gray },
  bold: { fontWeight: '700', color: fixed.ink },
  flex: { flex: 1 },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  error: { color: fixed.dangerStrong, fontSize: 13 },
  ok: { color: fixed.success, fontWeight: '600' },
  notice: {
    backgroundColor: fixed.warningBg,
    color: fixed.warning,
    padding: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  preview: { width: 140, height: 140, borderRadius: 14, backgroundColor: fixed.surface },
  empty: { alignItems: 'center', justifyContent: 'center' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  thumb: { width: 88, height: 88, borderRadius: 10, backgroundColor: fixed.surface },
});
