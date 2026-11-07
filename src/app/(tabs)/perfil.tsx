import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { Link } from '../../components/link';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
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
        <View style={styles.visitor}>
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

  return (
    <Screen edges={['top']}>
      <Text accessibilityRole="header" style={styles.title}>
        {t('Perfil')}
      </Text>
      <View style={styles.who}>
        <View style={styles.avatar}>
          <Text style={styles.letter}>
            {(auth.user.displayName || auth.user.email || '?')[0].toUpperCase()}
          </Text>
        </View>
        <View>
          <Text style={styles.name}>{auth.user.displayName}</Text>
          <Text style={styles.muted}>{auth.user.email}</Text>
        </View>
      </View>

      <Text accessibilityRole="header" style={styles.heading}>
        {t('Meus dados')}
      </Text>
      {editing ? (
        <>
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
            <Text accessibilityRole="alert" style={styles.error}>
              {saveError}
            </Text>
          ) : null}
          <Button label={t('Salvar')} onPress={() => void save()} loading={saving} />
          <Button variant="link" label={t('Cancelar')} onPress={() => setEditing(false)} />
        </>
      ) : profile ? (
        <>
          {rows.map(([label, value]) => (
            <View key={label} style={styles.between}>
              <Text style={styles.muted}>{label}</Text>
              <Text style={styles.value}>{value || '—'}</Text>
            </View>
          ))}
          <Button variant="outline" label={t('Editar')} onPress={() => edit(profile)} />
        </>
      ) : (
        <>
          <Text style={styles.muted}>{t('Seus dados ainda não foram salvos.')}</Text>
          <Button label={t('Preencher meus dados')} onPress={() => edit(null)} />
        </>
      )}

      {auth.isAdmin ? (
        <Link href={PATHS.admin as never} accessibilityRole="link" style={styles.link}>
          {t('Administração')}
        </Link>
      ) : null}
      <Button variant="outline" label={t('Sair')} onPress={() => void signOut()} />
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
  title: { fontSize: 24, fontWeight: '700', color: fixed.ink },
  visitor: {
    alignItems: 'center',
    gap: 16,
    padding: 24,
    borderRadius: 16,
    backgroundColor: '#e8edf3',
  },
  visitorText: { fontSize: 16, color: fixed.ink },
  visitorButton: { width: '100%' },
  heading: { fontSize: 18, fontWeight: '700', color: fixed.ink },
  who: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: fixed.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: { color: fixed.white, fontSize: 22, fontWeight: '700' },
  name: { fontSize: 18, fontWeight: '700', color: fixed.ink },
  muted: { color: fixed.gray },
  bold: { fontWeight: '700', color: fixed.ink },
  value: { color: fixed.ink, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  between: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  link: { color: fixed.accentText, fontWeight: '600', paddingVertical: 8 },
  error: { color: fixed.dangerStrong },
  legal: { gap: 4, marginTop: 8 },
});
