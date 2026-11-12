import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../../components/text';
import {
  AdminCard,
  AdminTop,
  AnswerButton,
  ShortcutCard,
  StatCard,
} from '../../components/admin-kit';
import { Screen } from '../../components/screen';
import { Spinner } from '../../components/spinner';
import { t } from '../../i18n';
import {
  adminOverview,
  approveProfessional,
  pendingProfessionals,
  rejectProfessional,
} from '../../services/admin';
import { fixed, radius } from '../../theme/colors';
import { useTheme } from '../../theme/theme';
import { PendingProfessional } from '../../utils/admin-list';
import { Overview } from '../../utils/admin-overview';
import { formatRelative } from '../../utils/format-date';
import { log } from '../../utils/log';
import { PATHS } from '../../utils/paths';

export default function Admin() {
  const router = useRouter();
  const theme = useTheme();
  const [list, setList] = useState<PendingProfessional[] | null>(null);
  const [error, setError] = useState('');
  // The numbers of the cards (they show up when they are ready; the list below does not wait for them)
  const [overview, setOverview] = useState<Overview | null>(null);
  // Id of the professional being answered
  const [working, setWorking] = useState<string | null>(null);

  const loadOverview = useCallback(() => {
    adminOverview()
      .then(setOverview)
      .catch((failure) => log.error('Failed to load the numbers of the dashboard', failure));
  }, []);

  const load = useCallback(async () => {
    setError('');
    loadOverview();
    try {
      setList(await pendingProfessionals());
    } catch (failure) {
      log.error('Failed to load pending professionals', failure);
      setError(t('Não foi possível carregar os cadastros.'));
      setList([]);
    }
  }, [loadOverview]);

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
      loadOverview();
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
    <Screen scroll={false} padded={false} edges={['top']}>
      <AdminTop title={t('Administração')} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text accessibilityRole="header" style={[styles.heading, { color: theme.muted }]}>
          {t('Visão geral')}
        </Text>
        <View style={styles.stats}>
          <StatCard
            icon="pending-actions"
            value={overview?.pending ?? null}
            label={t('Aguardando aprovação')}
            attention={(overview?.pending ?? 0) > 0}
          />
          <StatCard
            icon="visibility"
            value={overview?.published ?? null}
            label={t('Profissionais públicos')}
            note={overview ? t('de {{n}} aprovados', { n: overview.professionals }) : undefined}
          />
          <StatCard
            icon="visibility-off"
            value={overview?.hidden ?? null}
            label={t('Profissionais privados')}
            note={t('ocultos ou incompletos')}
          />
          <StatCard
            icon="person-add"
            value={overview?.drafts ?? null}
            label={t('Perfis sem conta')}
            note={overview ? t('{{n}} com link ativo', { n: overview.invites }) : undefined}
            onPress={() => router.push(PATHS.adminDrafts as never)}
          />
        </View>

        <Text accessibilityRole="header" style={[styles.heading, { color: theme.muted }]}>
          {t('Atalhos')}
        </Text>
        <ShortcutCard
          icon="add"
          title={t('Criar perfil sem conta')}
          text={t('Monte o perfil e gere o link para o profissional assumir.')}
          onPress={() => router.push(PATHS.adminNewDraft as never)}
        />
        <ShortcutCard
          icon="person-remove"
          title={t('Apagar um usuário')}
          text={t('Remove a conta com tudo: Firestore, Storage, Stripe e login.')}
          danger
          onPress={() => router.push(PATHS.adminUsers as never)}
        />

        <Text accessibilityRole="header" style={[styles.heading, { color: theme.muted }]}>
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
            <AdminCard key={professional.id}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={professional.name}
                onPress={() => router.push(`/admin/profissionais/${professional.id}` as never)}
                style={styles.info}
              >
                <Text style={[styles.name, { color: theme.text }]}>{professional.name}</Text>
                <Text style={{ color: theme.muted }}>{professional.email}</Text>
                <Text style={{ color: theme.muted }}>{professional.phone || t('Sem celular')}</Text>
                <Text style={{ color: theme.muted }}>
                  {t('Cadastro: {{when}}', { when: formatRelative(professional.createdAt) })}
                </Text>
                <Text style={[styles.link, { color: theme.primary }]}>
                  {t('Ver perfil completo')}
                </Text>
              </Pressable>
              <View style={styles.actions}>
                <AnswerButton
                  kind="approve"
                  icon
                  label={t('Aprovar')}
                  onPress={() => void run(professional, true)}
                  disabled={working !== null}
                />
                <AnswerButton
                  kind="deny"
                  icon
                  label={t('Negar')}
                  onPress={() => deny(professional)}
                  disabled={working !== null}
                />
              </View>
            </AdminCard>
          ))
        ) : (
          <Text style={{ color: theme.muted }}>{t('Nenhum cadastro aguardando aprovação.')}</Text>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 24, gap: 16 },
  heading: { fontSize: 18, fontWeight: '500' },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  info: { gap: 2 },
  name: { fontSize: 18, fontWeight: '700', marginBottom: 2 },
  link: { fontWeight: '600', marginTop: 8 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  error: {
    padding: 12,
    borderRadius: radius.card,
    overflow: 'hidden',
    backgroundColor: fixed.dangerBg,
    color: fixed.danger,
  },
});
