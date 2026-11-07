import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../components/text';
import { BackButton } from '../../components/back-button';
import { Button } from '../../components/button';
import { Screen } from '../../components/screen';
import { Spinner } from '../../components/spinner';
import { t } from '../../i18n';
import {
  approveProfessional,
  pendingProfessionals,
  rejectProfessional,
} from '../../services/admin';
import { fixed } from '../../theme/colors';
import { PendingProfessional } from '../../utils/admin-list';
import { formatRelative } from '../../utils/format-date';
import { log } from '../../utils/log';

export default function Admin() {
  const router = useRouter();
  const [list, setList] = useState<PendingProfessional[] | null>(null);
  const [error, setError] = useState('');
  // Id of the professional being answered
  const [working, setWorking] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError('');
    try {
      setList(await pendingProfessionals());
    } catch (failure) {
      log.error('Failed to load pending professionals', failure);
      setError(t('Não foi possível carregar os cadastros.'));
      setList([]);
    }
  }, []);

  useEffect(() => {
    // Waits a tick so the state is not set while the screen is being mounted
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  const run = async (professional: PendingProfessional, approve: boolean) => {
    setWorking(professional.id);
    setError('');
    try {
      if (approve) await approveProfessional(professional.id);
      else await rejectProfessional(professional.id);
      setList((current) => current?.filter((item) => item.id !== professional.id) ?? null);
    } catch (failure) {
      log.error('Failed to answer', failure);
      setError(t('Não foi possível concluir. Tente novamente.'));
    } finally {
      setWorking(null);
    }
  };

  const deny = (professional: PendingProfessional) =>
    Alert.alert(t('Negar o cadastro de {{name}}?', { name: professional.name }), undefined, [
      { text: t('Cancelar'), style: 'cancel' },
      { text: t('Negar'), style: 'destructive', onPress: () => void run(professional, false) },
    ]);

  return (
    <Screen>
      <BackButton />
      <Text accessibilityRole="header" style={styles.title}>
        {t('Administração')}
      </Text>
      <Text accessibilityRole="header" style={styles.heading}>
        {t('Aguardando aprovação')}
      </Text>
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
      {list === null ? (
        <Spinner small />
      ) : list.length ? (
        list.map((professional) => (
          <View key={professional.id} style={styles.card}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={professional.name}
              onPress={() => router.push(`/admin/profissionais/${professional.id}` as never)}
              style={styles.info}
            >
              <Text style={styles.name}>{professional.name}</Text>
              <Text style={styles.muted}>{professional.email}</Text>
              <Text style={styles.muted}>{professional.phone}</Text>
              <Text style={styles.muted}>
                {t('Cadastro: {{when}}', { when: formatRelative(professional.createdAt) })}
              </Text>
              <Text style={styles.link}>{t('Ver perfil completo')}</Text>
            </Pressable>
            <View style={styles.actions}>
              <View style={styles.flex}>
                <Button
                  label={t('Aprovar')}
                  onPress={() => void run(professional, true)}
                  loading={working === professional.id}
                  disabled={working !== null}
                />
              </View>
              <View style={styles.flex}>
                <Button
                  variant="outline"
                  label={t('Negar')}
                  onPress={() => deny(professional)}
                  disabled={working !== null}
                />
              </View>
            </View>
          </View>
        ))
      ) : (
        <Text style={styles.muted}>{t('Nenhum cadastro aguardando aprovação.')}</Text>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: '700', color: fixed.ink },
  heading: { fontSize: 20, fontWeight: '700', color: fixed.ink },
  card: {
    gap: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: fixed.borderSoft,
    borderRadius: 14,
    backgroundColor: fixed.white,
  },
  info: { gap: 2 },
  name: { fontSize: 17, fontWeight: '700', color: fixed.ink },
  muted: { color: fixed.gray },
  link: { color: fixed.accentText, fontWeight: '600', marginTop: 4 },
  actions: { flexDirection: 'row', gap: 8 },
  flex: { flex: 1 },
  error: { color: fixed.dangerStrong },
});
