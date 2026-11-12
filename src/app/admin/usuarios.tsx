import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AdminCard, AdminTop } from '../../components/admin-kit';
import { Button } from '../../components/button';
import { FormField } from '../../components/form-kit';
import { Screen } from '../../components/screen';
import { Spinner } from '../../components/spinner';
import { Text } from '../../components/text';
import { useToast } from '../../contexts/toast';
import { t } from '../../i18n';
import { deleteAccount, searchAccounts } from '../../services/accounts';
import { fixed, radius } from '../../theme/colors';
import { useTheme } from '../../theme/theme';
import { AccountRow, confirmationMatches, confirmationText } from '../../utils/accounts';
import { log } from '../../utils/log';

// An admin finds an account and deletes it with everything it has (Firestore, Storage and Authentication)
export default function AdminUsers() {
  const theme = useTheme();
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [list, setList] = useState<AccountRow[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  // The account that is about to be deleted, and what the admin typed to confirm it
  const [selected, setSelected] = useState<AccountRow | null>(null);
  const [typed, setTyped] = useState('');
  const [deleting, setDeleting] = useState(false);

  const search = async () => {
    setSearching(true);
    setError('');
    setSelected(null);
    try {
      setList(await searchAccounts(query));
    } catch (failure) {
      log.error('Failed to search the accounts', failure);
      setError(t('Não foi possível buscar os usuários.'));
    } finally {
      setSearching(false);
    }
  };

  const remove = async () => {
    if (!selected || !confirmationMatches(selected, typed)) return;
    setDeleting(true);
    setError('');
    try {
      await deleteAccount(selected.uid, typed);
      setList((current) => (current ?? []).filter((row) => row.uid !== selected.uid));
      toast.show(t('Usuário apagado: {{name}}', { name: selected.name || selected.email }), 5000);
      setSelected(null);
    } catch (failure) {
      log.error('Failed to delete the account', failure);
      const message = (failure as { message?: string }).message ?? '';
      setError(
        message.includes('payment still open')
          ? t(
              'Este usuário tem um agendamento com pagamento em aberto. Cancele o agendamento antes de apagar.',
            )
          : t('Não foi possível apagar o usuário. Tente novamente.'),
      );
    } finally {
      setDeleting(false);
    }
  };

  const roleLabel = (account: AccountRow) =>
    account.role === 'professional'
      ? t('Profissional')
      : account.role === 'client'
        ? t('Cliente')
        : t('Sem perfil');

  return (
    <Screen scroll={false} padded={false} edges={['top']}>
      <AdminTop title={t('Apagar um usuário')} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={{ color: theme.muted }}>
          {t(
            'Procure a conta pelo e-mail, pelo nome ou pelo id. Apagar remove tudo dela: o perfil, os agendamentos, as conversas, as avaliações, os favoritos, as fotos e o login. Não dá para desfazer.',
          )}
        </Text>
        <FormField
          label={t('Buscar usuário')}
          placeholder={t('E-mail, nome ou id')}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoComplete="off"
          returnKeyType="search"
          onSubmitEditing={() => void search()}
        />
        <Button label={t('Buscar')} onPress={() => void search()} loading={searching} />

        {error ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
        ) : null}

        {searching ? (
          <Spinner small />
        ) : list && !list.length ? (
          <Text style={{ color: theme.muted }}>{t('Nenhum usuário encontrado.')}</Text>
        ) : (
          (list ?? []).map((account) => (
            <AdminCard key={account.uid}>
              <Text style={[styles.name, { color: theme.text }]}>
                {account.name || account.email || account.uid}
              </Text>
              <Text style={{ color: theme.muted }}>{account.email}</Text>
              <Text style={{ color: theme.primary }}>
                {roleLabel(account)}
                {account.admin ? ` · ${t('Admin')}` : ''}
              </Text>
              {account.admin ? (
                <Text style={{ color: theme.muted }}>
                  {t('Contas de admin não são apagadas aqui. Tire o admin primeiro.')}
                </Text>
              ) : selected?.uid === account.uid ? (
                <View style={styles.confirm}>
                  <Text style={{ color: theme.text }}>
                    {t(
                      'Isso apaga tudo de {{name}}: Firestore, Storage e login. Para confirmar, digite {{word}}.',
                      { name: account.name || account.email, word: confirmationText(account) },
                    )}
                  </Text>
                  <FormField
                    label={t('Confirmar')}
                    value={typed}
                    onChangeText={setTyped}
                    autoCapitalize="none"
                    autoComplete="off"
                  />
                  <Button
                    variant="danger"
                    label={deleting ? t('Apagando...') : t('Apagar tudo')}
                    onPress={() => void remove()}
                    disabled={!confirmationMatches(account, typed) || deleting}
                    loading={deleting}
                  />
                  <Button
                    variant="outline"
                    label={t('Voltar')}
                    onPress={() => setSelected(null)}
                    disabled={deleting}
                  />
                </View>
              ) : (
                <Button
                  variant="danger"
                  label={t('Apagar')}
                  onPress={() => {
                    setSelected(account);
                    setTyped('');
                    setError('');
                  }}
                />
              )}
            </AdminCard>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 24, gap: 16 },
  name: { fontSize: 18, fontWeight: '700' },
  confirm: { gap: 12 },
  error: {
    padding: 12,
    borderRadius: radius.card,
    overflow: 'hidden',
    backgroundColor: fixed.dangerBg,
    color: fixed.danger,
  },
});
