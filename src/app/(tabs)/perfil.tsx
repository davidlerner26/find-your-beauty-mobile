import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { Link } from '../../components/link';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../components/text';
import { Button } from '../../components/button';
import { Guard } from '../../components/guard';
import { Screen } from '../../components/screen';
import { Spinner } from '../../components/spinner';
import { TextField } from '../../components/text-field';
import { useAuth, useAuthActions } from '../../contexts/auth';
import { useToast } from '../../contexts/toast';
import { t } from '../../i18n';
import { UserProfile } from '../../models/user';
import { users } from '../../services/users';
import { fixed } from '../../theme/colors';
import { useTheme } from '../../theme/theme';
import { hasErrors, ProfileValues, validateProfile } from '../../utils/auth-forms';
import { formatCpf } from '../../utils/cpf';
import { localizeAddress } from '../../utils/address';
import { log } from '../../utils/log';
import { formatPhone } from '../../utils/phone';
import { PATHS } from '../../utils/paths';

export default function ProfileScreen() {
  return (
    <Guard kind="clientArea" proPath={PATHS.proProfile}>
      <Profile />
    </Guard>
  );
}

const EMPTY: ProfileValues = { firstName: '', lastName: '', phone: '', cpf: '' };

function Profile() {
  const theme = useTheme();
  const auth = useAuth();
  const { signOut, updateName } = useAuthActions();
  const toast = useToast();
  const router = useRouter();
  const uid = auth.user?.uid;
  // The `users/{uid}` document of the signed in user (undefined while loading, null when there is none)
  const [loaded, setLoaded] = useState<{
    uid: string;
    profile: UserProfile | null;
    failed: boolean;
  } | null>(null);
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState<ProfileValues>(EMPTY);
  const [address, setAddress] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addressError, setAddressError] = useState('');
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (!uid) return;
    users
      .get(uid)
      .then((profile) => setLoaded({ uid, profile, failed: false }))
      .catch((error) => {
        log.error('Failed to load the profile', error);
        setLoaded({ uid, profile: null, failed: true });
      });
  }, [uid]);

  const profile = loaded && loaded.uid === uid ? loaded.profile : null;
  const loading = !!uid && !(loaded && loaded.uid === uid);
  const errors = submitted ? validateProfile(values) : {};

  const edit = (data: UserProfile | null) => {
    setValues({
      firstName: data?.firstName ?? '',
      lastName: data?.lastName ?? '',
      phone: data?.phone ? formatPhone(data.phone) : '',
      cpf: data?.cpf ? formatCpf(data.cpf) : '',
    });
    setAddress(data?.address ?? '');
    setSubmitted(false);
    setAddressError('');
    setSaveError('');
    setEditing(true);
  };

  const set = (field: keyof ProfileValues) => (value: string) =>
    setValues((current) => ({ ...current, [field]: value }));

  const save = async () => {
    setSubmitted(true);
    if (!uid) return;
    if (!address.trim()) {
      setAddressError(t('Digite o seu endereço.'));
      return;
    }
    if (hasErrors(validateProfile(values))) return;

    setSaveError('');
    setAddressError('');
    setSaving(true);
    try {
      // The address has to be one that exists: it is searched, and the position found is what is saved
      const [found] = await Location.geocodeAsync(address.trim()).catch((error) => {
        log.warn('Failed to find the address', error);
        return [];
      });
      if (!found) {
        setAddressError(t('Não encontramos esse endereço. Inclua a rua, o número e a cidade.'));
        return;
      }
      const data = {
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        phone: values.phone,
        cpf: values.cpf,
        address: address.trim(),
        addressPosition: { lat: found.latitude, lng: found.longitude },
      };
      await users.update(uid, data);
      await updateName(`${data.firstName} ${data.lastName}`);
      // Shows what was just saved, without waiting for another read
      setLoaded({
        uid,
        failed: false,
        profile: { email: auth.user?.email ?? '', ...profile, ...data },
      });
      setEditing(false);
      toast.show(t('Perfil atualizado'));
    } catch (error) {
      log.error('Failed to save profile', error);
      setSaveError(t('Não foi possível salvar. Tente novamente.'));
    } finally {
      setSaving(false);
    }
  };

  if (!auth.ready || loading) return <Spinner />;

  if (!auth.user) {
    return (
      <Screen edges={['top']}>
        <Text accessibilityRole="header" style={styles.title}>
          {t('Perfil')}
        </Text>
        <View style={[styles.visitor, { backgroundColor: theme.primaryLight }]}>
          <Text style={styles.visitorText}>{t('Você não está logado.')}</Text>
          <View style={styles.visitorButton}>
            <Button label={t('Entrar')} onPress={() => router.push(PATHS.login as never)} />
          </View>
        </View>
        <Legal />
      </Screen>
    );
  }

  const rows: [string, string][] = profile
    ? [
        [t('Nome'), profile.firstName],
        [t('Sobrenome'), profile.lastName],
        [t('E-mail'), profile.email],
        [t('Celular'), profile.phone],
        ['CPF', profile.cpf ?? ''],
        [t('Endereço'), profile.address ? localizeAddress(profile.address) : ''],
      ]
    : [];

  const user = auth.user;
  const initial = (user.displayName || user.email || '?')[0].toUpperCase();

  return (
    <Screen edges={['top']}>
      <Text accessibilityRole="header" style={styles.title}>
        {t('Perfil')}
      </Text>
      <View style={[styles.who, { backgroundColor: theme.primaryLight }]}>
        {user.photoURL ? (
          <Image
            accessibilityIgnoresInvertColors
            source={{ uri: user.photoURL }}
            contentFit="cover"
            style={styles.avatar}
          />
        ) : (
          <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
            <Text style={[styles.letter, { color: theme.onPrimary }]}>{initial}</Text>
          </View>
        )}
        <View style={styles.flex}>
          <Text style={styles.name}>{user.displayName || t('Sem nome')}</Text>
          <Text style={styles.muted}>{user.email}</Text>
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.detailsHead}>
          <Text accessibilityRole="header" style={styles.heading}>
            {t('Meus dados')}
          </Text>
          {!editing ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('Editar meus dados')}
              onPress={() => edit(profile)}
              style={[styles.edit, { backgroundColor: theme.primaryLight }]}
            >
              <MaterialIcons name="edit" size={20} color={theme.primary} />
            </Pressable>
          ) : null}
        </View>
        {editing ? (
          <View style={styles.form}>
            <TextField
              label={t('Nome')}
              value={values.firstName}
              onChangeText={set('firstName')}
              error={errors.firstName}
              autoComplete="given-name"
            />
            <TextField
              label={t('Sobrenome')}
              value={values.lastName}
              onChangeText={set('lastName')}
              error={errors.lastName}
              autoComplete="family-name"
            />
            <TextField
              label={t('Celular')}
              value={values.phone}
              onChangeText={(value) => set('phone')(formatPhone(value))}
              error={errors.phone}
              keyboardType="phone-pad"
            />
            <TextField
              label="CPF"
              value={values.cpf}
              onChangeText={(value) => set('cpf')(formatCpf(value))}
              error={errors.cpf}
              keyboardType="number-pad"
            />
            <TextField
              label={t('Endereço')}
              value={address}
              onChangeText={(value) => {
                setAddress(value);
                setAddressError('');
              }}
              error={addressError}
              placeholder={t('Rua, número, bairro e cidade')}
            />
            {saveError ? (
              <Text accessibilityRole="alert" style={[styles.error, { color: theme.errorFg }]}>
                {saveError}
              </Text>
            ) : null}
            <View style={styles.formActions}>
              <View style={styles.flex}>
                <Button variant="outline" label={t('Cancelar')} onPress={() => setEditing(false)} />
              </View>
              <View style={styles.flex}>
                <Button label={t('Salvar')} onPress={() => void save()} loading={saving} />
              </View>
            </View>
          </View>
        ) : profile ? (
          <View style={styles.rows}>
            {rows.map(([label, value]) => (
              <View key={label} style={styles.between}>
                <Text style={styles.muted}>{label}</Text>
                <Text style={styles.value}>{value || '-'}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.rows}>
            <Text style={styles.muted}>{t('Seus dados ainda não foram salvos.')}</Text>
            <Button label={t('Preencher meus dados')} onPress={() => edit(null)} />
          </View>
        )}
      </View>

      <View style={styles.status}>
        <View style={styles.dot} />
        <Text style={{ color: theme.primary }}>{t('Você está logado')}</Text>
      </View>

      {auth.isAdmin ? (
        <Button
          variant="outline"
          label={t('Administração')}
          onPress={() => router.push(PATHS.admin as never)}
        />
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('Sair')}
        onPress={() => void signOut()}
        style={styles.signOut}
      >
        <Text style={styles.signOutText}>{t('Sair')}</Text>
      </Pressable>
      <Legal />
    </Screen>
  );
}

function Legal() {
  return (
    <View style={styles.legal}>
      <Link href={'/privacidade' as never} accessibilityRole="link" style={styles.muted}>
        {t('Política de Privacidade')}
      </Link>
      <Link href={'/termos' as never} accessibilityRole="link" style={styles.muted}>
        {t('Termos de Uso')}
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  title: { fontSize: 24, fontWeight: '700', color: fixed.ink },
  visitor: {
    alignItems: 'center',
    gap: 16,
    padding: 24,
    borderRadius: 16,
  },
  visitorText: { fontSize: 16, color: fixed.ink },
  visitorButton: { width: '100%' },
  heading: { fontSize: 18, fontWeight: '700', color: fixed.ink },
  who: { flexDirection: 'row', alignItems: 'center', gap: 20, padding: 24, borderRadius: 16 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  letter: { fontSize: 28, fontWeight: '600' },
  name: { fontSize: 19, fontWeight: '700', color: fixed.ink, marginBottom: 4 },
  muted: { color: fixed.gray },
  value: { color: fixed.ink, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  details: { gap: 16 },
  detailsHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  edit: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rows: { gap: 16 },
  between: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: fixed.borderSoft,
  },
  form: { gap: 12 },
  formActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  error: { fontSize: 14 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: fixed.success },
  signOut: {
    minHeight: 56,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: fixed.dangerStrong,
    backgroundColor: fixed.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutText: { color: fixed.dangerStrong, fontSize: 17 },
  legal: { gap: 4, marginTop: 8 },
});
