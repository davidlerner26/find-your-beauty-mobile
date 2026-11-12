import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { AddressField } from '../../../components/address-field';
import { PhotoPositioner } from '../../../components/photo-positioner';
import { ServicesEditor } from '../../../components/services-editor';
import { AdminTop } from '../../../components/admin-kit';
import { Button } from '../../../components/button';
import { InviteLinkBox } from '../../../components/invite-link-box';
import { FormField, FormSection } from '../../../components/form-kit';
import { Screen } from '../../../components/screen';
import { SelectField } from '../../../components/select-field';
import { Spinner } from '../../../components/spinner';
import { Text } from '../../../components/text';
import { t } from '../../../i18n';
import { copyText } from '../../../services/clipboard';
import {
  createInviteLink,
  deleteDraft,
  getDraft,
  newDraftId,
  removeDraftPhoto,
  revokeInvite,
  saveDraft,
  uploadDraftPhoto,
} from '../../../services/professional-drafts';
import { SERVICE_PLACES } from '../../../models/professional';
import { placesAvailable } from '../../../services/places';
import { fixed, radius } from '../../../theme/colors';
import { useTheme } from '../../../theme/theme';
import {
  DraftForm,
  draftMissing,
  draftNeedsAddress,
  emptyDraftForm,
  inviteStatus,
  NO_POSITION,
  ProfessionalDraft,
  validateDraft,
} from '../../../utils/drafts';
import { log } from '../../../utils/log';
import { formatAddress } from '../../../utils/address-format';
import { formatCpf } from '../../../utils/cpf';
import { formatPhone } from '../../../utils/phone';
import { PATHS } from '../../../utils/paths';

// Makes or edits a profile for a professional who has no account yet. It has everything of the sign up of a
// professional (CPF, photos, address, services, hours), except connecting the Instagram: that needs her own login, so
// here it is only the link. What is left empty she completes after claiming the profile.
export default function AdminDraft() {
  const router = useRouter();
  const theme = useTheme();
  const { id: param } = useLocalSearchParams<{ id: string }>();
  const creating = param === 'novo';
  // A new draft gets its id now, so the photo can be uploaded before the first save
  const [newId] = useState(() => (creating ? newDraftId() : ''));
  const id = creating ? newId : param;
  // Saved with its link: from then on it is an existing draft
  const [created, setCreated] = useState(false);
  const isNew = creating && !created;

  const [draft, setDraft] = useState<ProfessionalDraft | null>(null);
  const [form, setForm] = useState<DraftForm>(emptyDraftForm);
  // The link that was just made
  const [made, setMade] = useState<{ url: string; copied: boolean } | null>(null);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<'profile' | 'gallery' | 'services' | null>(null);
  const [addressError, setAddressError] = useState('');
  const [checkingAddress, setCheckingAddress] = useState(false);
  // Photos that the draft no longer uses: deleted from the storage once it is saved
  const removed = useRef<string[]>([]);
  const { width } = useWindowDimensions();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isNew) return;
    let current = true;
    getDraft(id)
      .then((found) => {
        if (!current) return;
        if (!found) {
          router.replace(PATHS.adminDrafts as never);
          return;
        }
        setDraft(found);
        setForm(found.form);
      })
      .catch((failure) => {
        log.error('Failed to load the draft', failure);
        if (current) setError(t('Não foi possível carregar o perfil.'));
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, [id, isNew, router]);

  const change = <Field extends keyof DraftForm>(field: Field, value: DraftForm[Field]) =>
    setForm((current) => ({ ...current, [field]: value }));

  const errors = submitted ? validateDraft(form) : {};

  const hasPlace = (place: 'studio' | 'home') =>
    form.serviceMode === place || form.serviceMode === 'both';
  // Each place is switched on or off on its own; both on is 'both'
  const togglePlace = (place: 'studio' | 'home') => {
    const studio = hasPlace('studio') !== (place === 'studio');
    const home = hasPlace('home') !== (place === 'home');
    change('serviceMode', studio && home ? 'both' : studio ? 'studio' : home ? 'home' : null);
  };

  // Picks photos of the library and uploads them to the folder of the draft
  const pickAndUpload = async (folder: 'profile' | 'gallery' | 'services') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: folder === 'gallery',
    });
    if (result.canceled) return [];
    setUploading(folder);
    setError('');
    try {
      return await Promise.all(result.assets.map((asset) => uploadDraftPhoto(id, folder, asset)));
    } catch (failure) {
      log.error('Failed to upload the photo', failure);
      setError(t('Não foi possível enviar a foto. Use uma imagem e tente novamente.'));
      return [];
    } finally {
      setUploading(null);
    }
  };

  const changeProfilePhoto = async () => {
    const [url] = await pickAndUpload('profile');
    if (!url) return;
    // A new photo starts centered; the old one goes away once the draft is saved
    if (form.image) removed.current.push(form.image);
    setForm((current) => ({ ...current, image: url, imagePosition: { x: 50, y: 50 } }));
  };

  const addGallery = async () => {
    const urls = await pickAndUpload('gallery');
    if (urls.length) setForm((current) => ({ ...current, gallery: [...current.gallery, ...urls] }));
  };

  const removeGallery = (url: string) => {
    removed.current.push(url);
    setForm((current) => ({ ...current, gallery: current.gallery.filter((p) => p !== url) }));
  };

  // Without a Google key there are no suggestions: the address is confirmed with the geocoder of the phone
  const confirmAddress = async () => {
    const typed = form.address.trim();
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
      setForm((current) => ({
        ...current,
        address: formatAddress(typed, parts),
        position: { lat: found.latitude, lng: found.longitude },
        addressConfirmed: true,
      }));
    } catch (failure) {
      log.warn('Failed to find the address', failure);
      setAddressError(t('Não encontramos esse endereço. Inclua a rua, o número e a cidade.'));
    } finally {
      setCheckingAddress(false);
    }
  };

  // Saves, and makes the invite link when asked (it is copied and shown here: the admin sends it by hand)
  const save = async (withLink: boolean) => {
    setSubmitted(true);
    if (Object.keys(validateDraft(form)).length) return;

    setSaving(true);
    setError('');
    setMade(null);
    try {
      await saveDraft(id, form, isNew);
      // Only deletes the removed photos once the draft no longer points to them
      await Promise.all(removed.current.map(removeDraftPhoto));
      removed.current = [];
      if (!withLink) {
        router.replace(PATHS.adminDrafts as never);
        return;
      }
      const url = await createInviteLink(id);
      setMade({ url, copied: await copyText(url) });
      setCreated(true);
      setDraft(await getDraft(id));
    } catch (failure) {
      log.error('Failed to save the draft', failure);
      setError(t('Não foi possível salvar. Tente novamente.'));
    } finally {
      setSaving(false);
    }
  };

  const revoke = () =>
    Alert.alert(t('Cancelar o link? O link enviado deixa de funcionar.'), undefined, [
      { text: t('Voltar'), style: 'cancel' },
      {
        text: t('Cancelar link'),
        style: 'destructive',
        onPress: () => {
          revokeInvite(id)
            .then(() =>
              setDraft((current) =>
                current ? { ...current, invited: false, inviteExpiresAt: null } : current,
              ),
            )
            .catch((failure) => {
              log.error('Failed to cancel the invite', failure);
              setError(t('Não foi possível cancelar o link.'));
            });
        },
      },
    ]);

  const remove = () =>
    Alert.alert(
      t('Apagar o perfil de {{name}}? Isso não pode ser desfeito.', { name: form.name }),
      undefined,
      [
        { text: t('Voltar'), style: 'cancel' },
        {
          text: t('Apagar perfil'),
          style: 'destructive',
          onPress: () => {
            deleteDraft(id, [
              form.image,
              ...form.gallery,
              ...form.services.flatMap((service) => service.photos),
              ...removed.current,
            ])
              .then(() => router.replace(PATHS.adminDrafts as never))
              .catch((failure) => {
                log.error('Failed to delete the draft', failure);
                setError(t('Não foi possível apagar o perfil.'));
              });
          },
        },
      ],
    );

  const status = draft ? inviteStatus(draft) : 'none';
  const busy = saving || uploading !== null;
  const missing = draftMissing(form);
  const photoSize = Math.floor((width - 48 - 24) / 3);

  return (
    <Screen scroll={false} padded={false} edges={['top']}>
      <AdminTop title={isNew ? t('Criar perfil') : t('Editar perfil')} />
      {loading ? (
        <Spinner small />
      ) : (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <FormField
            label={t('Nome')}
            value={form.name}
            onChangeText={(value) => change('name', value)}
            error={errors.name}
            maxLength={80}
            autoCapitalize="words"
          />
          <FormField
            label={t('E-mail (opcional)')}
            value={form.email}
            onChangeText={(value) => change('email', value)}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="off"
          />
          <Text style={{ color: theme.muted }}>
            {t(
              'Se preencher, só quem entrar com este e-mail consegue assumir o perfil. Se deixar em branco, quem tiver o link assume.',
            )}
          </Text>
          <FormField
            label="CPF"
            value={form.cpf}
            onChangeText={(text) => change('cpf', formatCpf(text))}
            error={errors.cpf}
            keyboardType="number-pad"
            placeholder="000.000.000-00"
          />
          <FormField
            label={t('Celular')}
            value={form.phone}
            onChangeText={(value) => change('phone', formatPhone(value))}
            keyboardType="phone-pad"
            maxLength={20}
          />
          <SelectField<DraftForm['lang']>
            label={t('Idioma dos e-mails')}
            value={form.lang}
            options={[
              { value: 'pt', label: 'Português' },
              { value: 'en', label: 'English' },
              { value: 'es', label: 'Español' },
            ]}
            onChange={(value) => change('lang', value)}
          />
          <FormField
            label={t('Sobre (opcional)')}
            value={form.about}
            onChangeText={(value) => change('about', value)}
            multiline
            maxLength={1500}
          />

          <Text accessibilityRole="header" style={[styles.heading, { color: theme.text }]}>
            {t('Foto')}
          </Text>
          <Text style={{ color: theme.muted }}>
            {t('Aparece nos cards, no topo da página e redonda nas mensagens.')}
          </Text>
          <View style={styles.photo}>
            {form.image ? null : (
              <View style={[styles.preview, styles.empty, { backgroundColor: theme.primaryLight }]}>
                <Text style={{ color: theme.primary }}>{t('Sem foto')}</Text>
              </View>
            )}
            <View style={styles.flex}>
              <Button
                variant="light"
                label={form.image ? t('Trocar foto') : t('Escolher foto')}
                onPress={() => void changeProfilePhoto()}
                loading={uploading === 'profile'}
                disabled={saving}
              />
            </View>
          </View>
          {form.image ? (
            <PhotoPositioner
              src={form.image}
              position={form.imagePosition}
              onChange={(imagePosition) => change('imagePosition', imagePosition)}
            />
          ) : null}

          <FormSection title="Instagram">
            <FormField
              label={t('Link do Instagram')}
              value={form.instagram}
              onChangeText={(value) => change('instagram', value)}
              placeholder="https://instagram.com/usuario"
              autoCapitalize="none"
              autoComplete="off"
              keyboardType="url"
            />
            <Text style={{ color: theme.muted }}>
              {t(
                'Só o link: conectar o Instagram para importar as fotos exige o login dela. Depois de assumir o perfil, ela mesma pode conectar.',
              )}
            </Text>
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
                  <Text style={{ color: theme.primary, fontSize: 16 }}>
                    + {t('Adicionar fotos')}
                  </Text>
                )}
              </Pressable>
            }
          >
            {form.gallery.length ? (
              <View style={styles.gallery}>
                {form.gallery.map((photo) => (
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
                {t('Mostre o trabalho dela: as fotos aparecem na galeria do perfil.')}
              </Text>
            )}
          </FormSection>

          <FormSection title={t('Localização')}>
            <Text style={{ color: theme.muted }}>
              {t('Onde ela atende? Pode escolher os dois.')}
            </Text>
            <View
              style={styles.modes}
              accessibilityRole="radiogroup"
              accessibilityLabel={t('Onde ela atende')}
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
            {form.serviceMode && draftNeedsAddress(form) ? (
              <>
                <AddressField
                  variant="form"
                  label={t('Endereço')}
                  placeholder={t('Rua, número, bairro e cidade')}
                  value={form.address}
                  onChangeText={(address) => {
                    setForm((current) => ({
                      ...current,
                      address,
                      addressConfirmed: false,
                      position: NO_POSITION,
                    }));
                    setAddressError('');
                  }}
                  onPlace={(place) => {
                    setForm((current) => ({
                      ...current,
                      address: place.address,
                      position: place.position,
                      addressConfirmed: true,
                    }));
                    setAddressError('');
                  }}
                  confirmed={form.addressConfirmed}
                  error={addressError || undefined}
                />
                {!placesAvailable() && !form.addressConfirmed ? (
                  <Button
                    variant="outline"
                    label={t('Confirmar endereço')}
                    loading={checkingAddress}
                    onPress={() => void confirmAddress()}
                    disabled={form.address.trim().length < 5}
                  />
                ) : null}
              </>
            ) : null}
          </FormSection>

          <ServicesEditor
            services={form.services}
            onChange={(services) => change('services', services)}
            tried={submitted}
            uploading={uploading === 'services'}
            onAddPhoto={async () => (await pickAndUpload('services'))[0] ?? null}
            onDiscard={(urls) => removed.current.push(...urls)}
            simple
          />
          {errors.services ? (
            <Text accessibilityRole="alert" style={styles.error}>
              {errors.services}
            </Text>
          ) : null}

          <Text style={{ color: theme.muted }}>
            {missing.length
              ? t(
                  'Falta para o perfil aparecer aos clientes assim que ela assumir: {{missing}}. Ela também pode completar depois.',
                  { missing: missing.join(', ') },
                )
              : t('O perfil está completo: aparece aos clientes assim que ela assumir.')}
          </Text>
          {!isNew && status === 'sent' ? (
            <Text style={{ color: theme.text }}>{t('Há um link gerado e ainda válido.')}</Text>
          ) : null}
          {!isNew && status === 'expired' ? (
            <Text style={{ color: fixed.danger }}>{t('O link expirou. Gere outro.')}</Text>
          ) : null}
          {error ? (
            <Text accessibilityRole="alert" style={styles.error}>
              {error}
            </Text>
          ) : null}

          {made ? <InviteLinkBox url={made.url} copied={made.copied} /> : null}

          <Button
            label={saving ? t('Salvando...') : t('Salvar')}
            onPress={() => void save(false)}
            loading={saving}
            disabled={uploading !== null}
          />
          <Button
            variant="light"
            label={isNew ? t('Salvar e gerar link') : t('Salvar e gerar novo link')}
            onPress={() => void save(true)}
            disabled={busy}
          />
          {!isNew && draft?.invited ? (
            <Button variant="outline" label={t('Cancelar link')} onPress={revoke} />
          ) : null}
          {!isNew ? <Button variant="danger" label={t('Apagar perfil')} onPress={remove} /> : null}
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 24, gap: 16 },
  heading: { fontSize: 18, fontWeight: '700' },
  flex: { flex: 1 },
  photo: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  preview: { width: 96, height: 96, borderRadius: 48 },
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
  empty: { alignItems: 'center', justifyContent: 'center' },
  error: {
    padding: 12,
    borderRadius: radius.card,
    overflow: 'hidden',
    backgroundColor: fixed.dangerBg,
    color: fixed.danger,
  },
});
