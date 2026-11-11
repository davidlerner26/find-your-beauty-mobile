import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { AdminCard, AdminTop } from '../../../components/admin-kit';
import { Button } from '../../../components/button';
import { InviteLinkBox } from '../../../components/invite-link-box';
import { Screen } from '../../../components/screen';
import { Spinner } from '../../../components/spinner';
import { Text } from '../../../components/text';
import { t } from '../../../i18n';
import { copyText } from '../../../services/clipboard';
import { createInviteLink, listDrafts } from '../../../services/professional-drafts';
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
  // The link that was just made
  const [made, setMade] = useState<{ name: string; url: string; copied: boolean } | null>(null);
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

  const makeLink = async (draft: ProfessionalDraft) => {
    setWorking(draft.id);
    setError('');
    setMade(null);
    try {
      const url = await createInviteLink(draft.id);
      setMade({ name: draft.form.name, url, copied: await copyText(url) });
      await load();
    } catch (failure) {
      log.error('Failed to make the invite link', failure);
      setError(t('Não foi possível gerar o link. Tente novamente.'));
    } finally {
      setWorking(null);
    }
  };

  const statusText = (draft: ProfessionalDraft) => {
    const status = inviteStatus(draft);
    if (status === 'sent') {
      return t('Link gerado {{when}}', { when: formatRelative(draft.invitedAt) });
    }
    return status === 'expired' ? t('Link expirado') : t('Link ainda não gerado');
  };

  return (
    <Screen scroll={false} padded={false} edges={['top']}>
      <AdminTop title={t('Perfis criados por você')} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={{ color: theme.muted }}>
          {t(
            'Crie o perfil de um profissional que ainda não tem conta e gere um link para enviar a ele (por WhatsApp, Instagram...). Ele assume o perfil abrindo o link.',
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
        {made ? <InviteLinkBox url={made.url} copied={made.copied} name={made.name} /> : null}
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
                {draft.form.email ? (
                  <Text style={{ color: theme.muted }}>{draft.form.email}</Text>
                ) : null}
                <Text
                  style={{ color: inviteStatus(draft) === 'expired' ? fixed.danger : theme.muted }}
                >
                  {statusText(draft)}
                </Text>
              </Pressable>
              <Button
                variant="light"
                label={
                  inviteStatus(draft) === 'none' ? t('Gerar e copiar link') : t('Gerar novo link')
                }
                onPress={() => void makeLink(draft)}
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
  error: {
    padding: 12,
    borderRadius: radius.card,
    overflow: 'hidden',
    backgroundColor: fixed.dangerBg,
    color: fixed.danger,
  },
});
