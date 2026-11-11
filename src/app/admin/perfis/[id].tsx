import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { AdminTop } from '../../../components/admin-kit';
import { Button } from '../../../components/button';
import { InviteLinkBox } from '../../../components/invite-link-box';
import { FormField } from '../../../components/form-kit';
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
import { fixed, radius } from '../../../theme/colors';
import { useTheme } from '../../../theme/theme';
import {
  DraftForm,
  EMPTY_DRAFT_FORM,
  inviteStatus,
  ProfessionalDraft,
  validateDraft,
} from '../../../utils/drafts';
import { log } from '../../../utils/log';
import { formatPhone } from '../../../utils/phone';
import { PATHS } from '../../../utils/paths';

// Makes or edits a profile for a professional who has no account yet. Only the basics: the professional completes
// the services, hours, address and CPF after claiming it.
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
  const [form, setForm] = useState<DraftForm>(EMPTY_DRAFT_FORM);
  // The link that was just made
  const [made, setMade] = useState<{ url: string; copied: boolean } | null>(null);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
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

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'] });
    if (result.canceled) return;
    setUploading(true);
    setError('');
    try {
      const previous = form.image;
      change('image', await uploadDraftPhoto(id, result.assets[0]));
      // The old one goes away now; a draft that was never saved has none
      if (previous) await removeDraftPhoto(previous);
    } catch (failure) {
      log.error('Failed to upload the photo', failure);
      setError(t('Não foi possível enviar a foto. Use uma imagem e tente novamente.'));
    } finally {
      setUploading(false);
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
            deleteDraft(id, form.image)
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
  const busy = saving || uploading;

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
            label={t('Instagram')}
            value={form.instagram}
            onChangeText={(value) => change('instagram', value)}
            placeholder={t('@usuario')}
            autoCapitalize="none"
            autoComplete="off"
          />
          <FormField
            label={t('Sobre')}
            value={form.about}
            onChangeText={(value) => change('about', value)}
            multiline
            maxLength={1500}
          />

          <Text accessibilityRole="header" style={[styles.heading, { color: theme.text }]}>
            {t('Foto')}
          </Text>
          <View style={styles.photo}>
            {form.image ? (
              <Image
                accessibilityIgnoresInvertColors
                source={{ uri: form.image }}
                style={styles.preview}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.preview, styles.empty, { backgroundColor: theme.primaryLight }]}>
                <Text style={{ color: theme.primary }}>{t('Sem foto')}</Text>
              </View>
            )}
            <Button
              variant="light"
              label={form.image ? t('Trocar foto') : t('Escolher foto')}
              onPress={() => void pickPhoto()}
              loading={uploading}
              disabled={saving}
            />
          </View>

          <Text style={{ color: theme.muted }}>
            {t(
              'Serviços, horários, endereço e CPF ficam para o profissional completar depois de assumir o perfil.',
            )}
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
            disabled={uploading}
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
  photo: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  preview: { width: 96, height: 96, borderRadius: 48 },
  empty: { alignItems: 'center', justifyContent: 'center' },
  error: {
    padding: 12,
    borderRadius: radius.card,
    overflow: 'hidden',
    backgroundColor: fixed.dangerBg,
    color: fixed.danger,
  },
});
