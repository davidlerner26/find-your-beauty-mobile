import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { Text } from '../../../components/text';
import { AdminCard, AdminTop, AnswerButton, StatusPill } from '../../../components/admin-kit';
import { Screen } from '../../../components/screen';
import { Spinner } from '../../../components/spinner';
import { t } from '../../../i18n';
import { DEFAULT_AVAILABILITY, formatDuration, Professional } from '../../../models/professional';
import {
  approveProfessional,
  cpfOf,
  professionalForReview,
  rejectProfessional,
} from '../../../services/admin';
import { fixed, radius } from '../../../theme/colors';
import { useTheme } from '../../../theme/theme';
import { approvalStatus } from '../../../utils/admin-list';
import { localizeAddress } from '../../../utils/address';
import { catalogLabel } from '../../../utils/catalog';
import { instagramUrl } from '../../../utils/instagram';
import { focusPosition } from '../../../utils/labels';
import { log } from '../../../utils/log';
import { formatPrice } from '../../../utils/money';
import { PATHS } from '../../../utils/paths';
import { ruleLabel } from '../../../utils/pricing';
import { workingHours } from '../../../utils/hours';

const STATUS = () => ({
  waiting: t('Aguardando aprovação'),
  denied: t('Negado'),
  approved: t('Aprovado'),
});

// The whole profile of a professional for an admin to review, even when it is not published
export default function AdminProfessional() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const [state, setState] = useState<{
    id: string;
    professional: Professional | null;
    cpf: string;
    failed: boolean;
  } | null>(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    Promise.all([professionalForReview(id), cpfOf(id).catch(() => '')])
      .then(
        ([professional, cpf]) => !cancelled && setState({ id, professional, cpf, failed: false }),
      )
      .catch((failure) => {
        log.error('Failed to load the profile for review', failure);
        if (!cancelled) setState({ id, professional: null, cpf: '', failed: true });
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!state || state.id !== id) return <Spinner />;
  const { professional: p, cpf } = state;

  const run = async (approve: boolean) => {
    if (!p) return;
    setWorking(true);
    setError('');
    try {
      if (approve) await approveProfessional(p.id);
      else await rejectProfessional(p.id);
      // Answered: it is no longer in the waiting list
      router.replace(PATHS.admin as never);
    } catch (failure) {
      log.error('Failed to answer', failure);
      setError(t('Não foi possível concluir. Tente novamente.'));
    } finally {
      setWorking(false);
    }
  };

  const deny = () =>
    p &&
    Alert.alert(t('Negar o cadastro de {{name}}?', { name: p.name }), undefined, [
      { text: t('Cancelar'), style: 'cancel' },
      { text: t('Negar'), style: 'destructive', onPress: () => void run(false) },
    ]);

  const status = p ? approvalStatus(p) : 'approved';
  const photoSize = Math.floor((width - 48 - 40 - 16) / 3);

  return (
    <Screen scroll={false} padded={false} edges={['top']}>
      <AdminTop title={t('Perfil do profissional')} />
      <ScrollView contentContainerStyle={styles.content}>
        {state.failed ? (
          <Text style={styles.error}>{t('Não foi possível carregar o perfil.')}</Text>
        ) : null}
        {!p && !state.failed ? (
          <Text style={{ color: theme.muted }}>{t('Profissional não encontrado.')}</Text>
        ) : null}
        {p ? (
          <>
            <AdminCard>
              <View style={styles.who}>
                {p.image ? (
                  <Image
                    accessibilityIgnoresInvertColors
                    source={{ uri: p.image }}
                    contentFit="cover"
                    contentPosition={focusPosition(p.imagePosition)}
                    style={styles.photo}
                  />
                ) : (
                  <View style={[styles.photo, { backgroundColor: theme.primaryLight }]}>
                    <Text style={[styles.noPhoto, { color: theme.primary }]}>{t('Sem foto')}</Text>
                  </View>
                )}
                <View style={styles.flex}>
                  <Text style={[styles.name, { color: theme.text }]}>{p.name}</Text>
                  <StatusPill status={status} label={STATUS()[status]} />
                </View>
              </View>
            </AdminCard>

            {error ? (
              <Text accessibilityRole="alert" style={styles.error}>
                {error}
              </Text>
            ) : null}
            {status !== 'approved' ? (
              <View style={styles.actions}>
                <AnswerButton
                  grow
                  kind="approve"
                  label={t('Aprovar')}
                  onPress={() => void run(true)}
                  disabled={working}
                />
                {status === 'waiting' ? (
                  <AnswerButton
                    grow
                    kind="deny"
                    label={t('Negar')}
                    onPress={deny}
                    disabled={working}
                  />
                ) : null}
              </View>
            ) : null}

            <AdminCard>
              <Title>{t('Contato')}</Title>
              <Row label={t('E-mail')} value={p.email ?? ''} />
              <Row label={t('Celular')} value={p.phone ?? ''} />
              <Row label="CPF" value={cpf} />
              {p.instagram ? (
                <Pressable
                  accessibilityRole="link"
                  accessibilityLabel={`Instagram @${p.instagram}`}
                  onPress={() => void Linking.openURL(instagramUrl(p.instagram!))}
                >
                  <Row label="Instagram" value={`@${p.instagram}`} link />
                </Pressable>
              ) : (
                <Row label="Instagram" value="" />
              )}
              <Row
                label={t('Atendimento')}
                value={
                  p.serviceMode === 'both'
                    ? `${t('No meu endereço')} · ${t('A domicílio')}`
                    : p.serviceMode === 'home'
                      ? t('A domicílio')
                      : t('No meu endereço')
                }
              />
              {p.serviceMode !== 'home' ? (
                <Row label={t('Endereço')} value={p.address ? localizeAddress(p.address) : ''} />
              ) : null}
            </AdminCard>

            <AdminCard>
              <Title>{t('Sobre')}</Title>
              {p.about.length ? (
                p.about.map((paragraph, n) => (
                  <Text key={n} style={{ color: theme.text }}>
                    {paragraph}
                  </Text>
                ))
              ) : (
                <Text style={{ color: theme.muted }}>{t('Não preenchido.')}</Text>
              )}
            </AdminCard>

            <AdminCard>
              <Title>{t('Serviços')}</Title>
              {p.services.length ? (
                p.services.map((service, n) => (
                  <View
                    key={service.id}
                    style={[
                      styles.service,
                      n < p.services.length - 1 && {
                        borderBottomWidth: 1,
                        borderBottomColor: fixed.borderSoft,
                      },
                    ]}
                  >
                    <View style={styles.flex}>
                      <Text style={[styles.bold, { color: theme.text }]}>
                        {catalogLabel(service.name)}
                      </Text>
                      <Text style={{ color: theme.muted }}>
                        {catalogLabel(service.category)} · {formatDuration(service.durationMinutes)}
                      </Text>
                      {service.description ? (
                        <Text style={{ color: theme.muted }}>{service.description}</Text>
                      ) : null}
                      {service.priceRules?.map((rule, i) => (
                        <Text key={i} style={[styles.rule, { color: theme.muted }]}>
                          {ruleLabel(rule)}:{' '}
                          <Text style={[styles.bold, { color: theme.text }]}>
                            {formatPrice(rule.price)}
                          </Text>
                        </Text>
                      ))}
                    </View>
                    <Text style={[styles.bold, { color: theme.text }]}>
                      {formatPrice(service.price)}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={{ color: theme.muted }}>{t('Nenhum serviço cadastrado.')}</Text>
              )}
            </AdminCard>

            <AdminCard>
              <Title>{t('Horários')}</Title>
              {workingHours(p.availability ?? DEFAULT_AVAILABILITY).map((line) => (
                <Row key={line.days} label={line.days} value={line.hours} />
              ))}
            </AdminCard>

            <AdminCard>
              <Title>{t('Galeria')}</Title>
              {p.gallery.length ? (
                <View style={styles.gallery}>
                  {p.gallery.map((photo) => (
                    <Pressable
                      key={photo}
                      accessibilityRole="link"
                      accessibilityLabel={t('Foto da galeria')}
                      onPress={() => void Linking.openURL(photo)}
                    >
                      <Image
                        accessibilityIgnoresInvertColors
                        source={{ uri: photo }}
                        contentFit="cover"
                        style={{
                          width: photoSize,
                          height: photoSize,
                          borderRadius: radius.card,
                          backgroundColor: fixed.surface,
                        }}
                      />
                    </Pressable>
                  ))}
                </View>
              ) : (
                <Text style={{ color: theme.muted }}>{t('Nenhuma foto.')}</Text>
              )}
            </AdminCard>
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function Title({ children }: { children: string }) {
  const theme = useTheme();
  return (
    <Text accessibilityRole="header" style={[styles.title, { color: theme.text }]}>
      {children}
    </Text>
  );
}

// A label on the left (it never breaks) and its value on the right, in bold
function Row({ label, value, link }: { label: string; value: string; link?: boolean }) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      <Text style={[styles.label, { color: theme.muted }]}>{label}</Text>
      <Text style={[styles.value, { color: link ? theme.primary : theme.text }]}>
        {value || '-'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 24, gap: 16 },
  who: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  noPhoto: { fontSize: 12, textAlign: 'center' },
  name: { fontSize: 20, fontWeight: '700' },
  flex: { flex: 1 },
  actions: { flexDirection: 'row', gap: 12 },
  title: { fontSize: 17, fontWeight: '700' },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 16 },
  label: { flexShrink: 0 },
  value: { flex: 1, fontWeight: '600', textAlign: 'right' },
  service: { flexDirection: 'row', justifyContent: 'space-between', gap: 16, paddingVertical: 12 },
  rule: { fontSize: 14, marginTop: 4 },
  bold: { fontWeight: '700' },
  gallery: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  error: {
    padding: 12,
    borderRadius: radius.card,
    overflow: 'hidden',
    backgroundColor: fixed.dangerBg,
    color: fixed.danger,
  },
});
