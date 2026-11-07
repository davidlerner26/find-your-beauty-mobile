import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../../../components/text';
import { BackButton } from '../../../components/back-button';
import { Button } from '../../../components/button';
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
import { fixed } from '../../../theme/colors';
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

  return (
    <Screen>
      <BackButton />
      <Text accessibilityRole="header" style={styles.title}>
        {t('Perfil do profissional')}
      </Text>
      {state.failed ? (
        <Text style={styles.error}>{t('Não foi possível carregar o perfil.')}</Text>
      ) : null}
      {!p && !state.failed ? (
        <Text style={styles.muted}>{t('Profissional não encontrado.')}</Text>
      ) : null}
      {p ? (
        <>
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
              <View style={[styles.photo, styles.empty]}>
                <Text style={styles.muted}>{t('Sem foto')}</Text>
              </View>
            )}
            <View style={styles.flex}>
              <Text style={styles.name}>{p.name}</Text>
              <Text style={styles.muted}>{STATUS()[approvalStatus(p)]}</Text>
            </View>
          </View>

          {approvalStatus(p) === 'waiting' ? (
            <View style={styles.actions}>
              <View style={styles.flex}>
                <Button label={t('Aprovar')} onPress={() => void run(true)} loading={working} />
              </View>
              <View style={styles.flex}>
                <Button variant="outline" label={t('Negar')} onPress={deny} disabled={working} />
              </View>
            </View>
          ) : null}
          {error ? (
            <Text accessibilityRole="alert" style={styles.error}>
              {error}
            </Text>
          ) : null}

          <Text accessibilityRole="header" style={styles.heading}>
            {t('Contato')}
          </Text>
          <Row label={t('E-mail')} value={p.email ?? ''} />
          <Row label={t('Celular')} value={p.phone ?? ''} />
          <Row label="CPF" value={cpf} />
          {p.instagram ? (
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={`Instagram @${p.instagram}`}
              onPress={() => void Linking.openURL(instagramUrl(p.instagram!))}
            >
              <Row label="Instagram" value={`@${p.instagram}`} />
            </Pressable>
          ) : null}
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
          {p.address ? <Row label={t('Endereço')} value={localizeAddress(p.address)} /> : null}

          <Text accessibilityRole="header" style={styles.heading}>
            {t('Sobre')}
          </Text>
          {p.about.length ? (
            p.about.map((paragraph, n) => (
              <Text key={n} style={styles.muted}>
                {paragraph}
              </Text>
            ))
          ) : (
            <Text style={styles.muted}>{t('Não preenchido.')}</Text>
          )}

          <Text accessibilityRole="header" style={styles.heading}>
            {t('Serviços')}
          </Text>
          {p.services.length ? (
            p.services.map((service) => (
              <View key={service.id} style={styles.card}>
                <Text style={styles.bold}>{catalogLabel(service.name)}</Text>
                <Text style={styles.muted}>
                  {formatPrice(service.price)} · {formatDuration(service.durationMinutes)}
                </Text>
                {service.priceRules?.map((rule, n) => (
                  <Text key={n} style={styles.muted}>
                    {ruleLabel(rule)}: {formatPrice(rule.price)}
                  </Text>
                ))}
                {service.description ? (
                  <Text style={styles.muted}>{service.description}</Text>
                ) : null}
              </View>
            ))
          ) : (
            <Text style={styles.muted}>{t('Nenhum serviço cadastrado.')}</Text>
          )}

          <Text accessibilityRole="header" style={styles.heading}>
            {t('Horários')}
          </Text>
          {workingHours(p.availability ?? DEFAULT_AVAILABILITY).map((line) => (
            <Row key={line.days} label={line.days} value={line.hours} />
          ))}

          <Text accessibilityRole="header" style={styles.heading}>
            {t('Galeria')}
          </Text>
          {p.gallery.length ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
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
                    style={styles.thumb}
                  />
                </Pressable>
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.muted}>{t('Nenhuma foto.')}</Text>
          )}
        </>
      ) : null}
    </Screen>
  );
}

const Row = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.row}>
    <Text style={styles.muted}>{label}</Text>
    <Text style={styles.value}>{value || '—'}</Text>
  </View>
);

const styles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: '700', color: fixed.ink },
  heading: { fontSize: 18, fontWeight: '700', color: fixed.ink, marginTop: 4 },
  who: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  photo: { width: 84, height: 84, borderRadius: 42, backgroundColor: fixed.surface },
  empty: { alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 20, fontWeight: '700', color: fixed.ink },
  flex: { flex: 1 },
  actions: { flexDirection: 'row', gap: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  value: { color: fixed.ink, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  card: { gap: 2, padding: 12, borderWidth: 1, borderColor: fixed.borderSoft, borderRadius: 12 },
  bold: { fontWeight: '700', color: fixed.ink },
  muted: { color: fixed.gray },
  error: { color: fixed.dangerStrong },
  thumb: { width: 110, height: 110, borderRadius: 10, backgroundColor: fixed.surface },
});
