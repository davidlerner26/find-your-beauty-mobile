import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { AdminCard, AdminTop } from '../../../components/admin-kit';
import { Button } from '../../../components/button';
import { Screen } from '../../../components/screen';
import { Spinner } from '../../../components/spinner';
import { Text } from '../../../components/text';
import { t } from '../../../i18n';
import { listDrafts, sendInvite } from '../../../services/professional-drafts';
import { fixed, radius } from '../../../theme/colors';
import { useTheme } from '../../../theme/theme';
import { inviteStatus, ProfessionalDraft } from '../../../utils/drafts';
import { formatRelative } from '../../../utils/format-date';
import { log } from '../../../utils/log';
import { PATHS } from '../../../utils/paths';

// The profiles the admin made for professionals who have no account yet, and the state of each invite
export default function AdminDrafts() {
  const router = useRouter();
  const theme = useTheme();
  const [list, setList] = useState<ProfessionalDraft[] | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  // Id of the draft whose invite is being sent
  const [working, setWorking] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError('');
    try {
      setList(await listDrafts());
    } catch (failure) {
      log.error('Failed to load the drafts', failure);
      setError(t('Não foi possível carregar os perfis.'));
      setList([]);
    }
  }, []);

  // Also when coming back from the form
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const invite = async (draft: ProfessionalDraft) => {
    setWorking(draft.id);
    setError('');
    setMessage('');
    try {
      await sendInvite(draft.id);
      setMessage(t('Convite enviado para {{email}}.', { email: draft.form.email }));
      await load();
    } catch (failure) {
      log.error('Failed to send the invite', failure);
      setError(t('Não foi possível enviar o convite. Tente novamente.'));
    } finally {
      setWorking(null);
    }
  };

  const statusText = (draft: ProfessionalDraft) => {
    const status = inviteStatus(draft);
    if (status === 'sent') {
      return t('Convite enviado {{when}}', { when: formatRelative(draft.invitedAt) });
    }
    return status === 'expired' ? t('Convite expirado') : t('Convite ainda não enviado');
  };

  return (
    <Screen scroll={false} padded={false} edges={['top']}>
      <AdminTop title={t('Perfis criados por você')} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={{ color: theme.muted }}>
          {t(
            'Crie o perfil de um profissional que ainda não tem conta e envie um convite por e-mail. Ele assume o perfil entrando com o e-mail do convite.',
          )}
        </Text>
        <Button
          label={t('Criar perfil')}
          onPress={() => router.push(PATHS.adminNewDraft as never)}
        />
        {error ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
        ) : null}
        {message ? (
          <Text accessibilityRole="alert" style={[styles.message, { color: theme.primary }]}>
            {message}
          </Text>
        ) : null}
        {list === null ? (
          <Spinner small />
        ) : list.length ? (
          list.map((draft) => (
            <AdminCard key={draft.id}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={draft.form.name}
                onPress={() => router.push(PATHS.adminDraft(draft.id) as never)}
                style={styles.info}
              >
                <Text style={[styles.name, { color: theme.text }]}>{draft.form.name}</Text>
                <Text style={{ color: theme.muted }}>{draft.form.email}</Text>
                <Text
                  style={{ color: inviteStatus(draft) === 'expired' ? fixed.danger : theme.muted }}
                >
                  {statusText(draft)}
                </Text>
              </Pressable>
              <Button
                variant="light"
                label={inviteStatus(draft) === 'none' ? t('Enviar convite') : t('Reenviar convite')}
                onPress={() => void invite(draft)}
                loading={working === draft.id}
                disabled={working !== null}
              />
            </AdminCard>
          ))
        ) : (
          <Text style={{ color: theme.muted }}>{t('Nenhum perfil criado ainda.')}</Text>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 24, gap: 16 },
  info: { gap: 2 },
  name: { fontSize: 18, fontWeight: '700', marginBottom: 2 },
  message: { fontWeight: '600' },
  error: {
    padding: 12,
    borderRadius: radius.card,
    overflow: 'hidden',
    backgroundColor: fixed.dangerBg,
    color: fixed.danger,
  },
});
