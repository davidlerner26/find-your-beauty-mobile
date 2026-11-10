import { Image } from 'expo-image';
import { useMemo } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Switch, View } from 'react-native';
import { Text, TextInput } from './text';
import { t } from '../i18n';
import { ServiceCategory } from '../models/professional';
import { fixed, Theme } from '../theme/colors';
import { useTheme } from '../theme/theme';
import { catalogLabel } from '../utils/catalog';
import { maskDuration } from '../utils/duration';
import { maskMoney } from '../utils/money';
import {
  isRuleComplete,
  isServiceComplete,
  newRuleDraft,
  newServiceDraft,
  PriceRuleDraft,
  serviceNamesOf,
  ServiceDraft,
  setCategory,
  toggleRuleDay,
} from '../utils/service-draft';
import { WEEKDAYS } from '../utils/weekdays';
import { TimeField } from './time-field';
import { Button } from './button';
import { Chip } from './chip';
import { SelectField } from './select-field';

const CATEGORIES: ServiceCategory[] = ['Maquiagem', 'Cabelo'];

type Props = {
  services: ServiceDraft[];
  onChange: (services: ServiceDraft[]) => void;
  // Shows what is missing in the services that are not complete
  tried: boolean;
  // Picks and uploads a photo for a service: its address, or null when nothing was picked
  onAddPhoto: () => Promise<string | null>;
  // Photos that the profile no longer uses (deleted from the storage when it is saved)
  onDiscard: (urls: string[]) => void;
  uploading: boolean;
};

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: boolean;
  children: React.ReactNode;
}) {
  const styles = useStyles();
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {error ? <Text style={styles.error}>{t('Obrigatório')}</Text> : null}
    </View>
  );
}

// Start and end of the day in a price rule ("Início do dia" / "Fim do dia"), as the site saves them
const DAY_START = '00:00';
const DAY_END = '24:00';

// A switch with its text on the side ("Início do dia" / "Fim do dia")
function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  const styles = useStyles();
  return (
    <View style={styles.toggle}>
      <Switch
        accessibilityLabel={label}
        value={checked}
        onValueChange={onChange}
        trackColor={{ true: fixed.accent }}
      />
      <Text style={styles.toggleText}>{label}</Text>
    </View>
  );
}

// The services of the professional: category, name, price (and prices by day and time), duration, photos
export function ServicesEditor({
  services,
  onChange,
  tried,
  onAddPhoto,
  onDiscard,
  uploading,
}: Props) {
  const theme = useTheme();
  const styles = useStyles();
  const update = (id: string, patch: Partial<ServiceDraft>) =>
    onChange(services.map((service) => (service.id === id ? { ...service, ...patch } : service)));

  const remove = (service: ServiceDraft) => {
    onDiscard(service.photos);
    onChange(services.filter((s) => s.id !== service.id));
  };

  const updateRule = (service: ServiceDraft, id: string, patch: Partial<PriceRuleDraft>) =>
    update(service.id, {
      priceRules: service.priceRules.map((rule) => (rule.id === id ? { ...rule, ...patch } : rule)),
    });

  return (
    <View style={styles.wrap}>
      <Text accessibilityRole="header" style={styles.heading}>
        {t('Serviços')}
      </Text>
      {services.map((service) => {
        const missing = tried && !isServiceComplete(service);
        return (
          <View
            key={service.id}
            style={[
              styles.card,
              { backgroundColor: theme.cardBg },
              theme.name === 'pro' && { borderColor: theme.cardBorder },
              missing && styles.cardMissing,
            ]}
          >
            <Field label={t('Categoria')} error={missing && !service.category}>
              <SelectField
                label={t('Categoria')}
                placeholder={t('Selecione')}
                value={service.category || null}
                options={CATEGORIES.map((category) => ({
                  value: category,
                  label: catalogLabel(category),
                }))}
                onChange={(category) => {
                  if (!category) return;
                  const next = { ...service };
                  setCategory(next, category);
                  update(service.id, { category: next.category, name: next.name });
                }}
              />
            </Field>

            {service.category ? (
              <Field label={t('Nome do serviço')} error={missing && !service.name.trim()}>
                <SelectField
                  label={t('Nome do serviço')}
                  placeholder={t('Selecione')}
                  value={service.name || null}
                  options={serviceNamesOf(service).map((name) => ({
                    value: name,
                    label: catalogLabel(name),
                  }))}
                  onChange={(name) => name && update(service.id, { name })}
                />
              </Field>
            ) : null}

            <View style={styles.row}>
              <View style={styles.half}>
                <Field
                  label={t('Preço (R$)')}
                  error={missing && maskMoney(service.price) === '0,00'}
                >
                  <TextInput
                    accessibilityLabel={t('Preço (R$)')}
                    value={service.price}
                    onChangeText={(text) => update(service.id, { price: maskMoney(text) })}
                    keyboardType="number-pad"
                    style={styles.input}
                  />
                </Field>
              </View>
              <View style={styles.half}>
                <Field label={t('Duração (h:mm)')} error={missing && service.duration === '0:00'}>
                  <TextInput
                    accessibilityLabel={t('Duração (h:mm)')}
                    value={service.duration}
                    onChangeText={(text) => update(service.id, { duration: maskDuration(text) })}
                    keyboardType="number-pad"
                    style={styles.input}
                  />
                </Field>
              </View>
            </View>

            {/* Another price for some days of the week and times */}
            <View style={styles.rules}>
              <Text style={styles.label}>{t('Preço por dia e horário')}</Text>
              {service.priceRules.map((rule) => (
                <View key={rule.id} style={[styles.rule, { borderColor: theme.muted }]}>
                  <View style={styles.ruleDays}>
                    {WEEKDAYS.map((day) => (
                      <Chip
                        key={day.key}
                        small
                        label={day.label.slice(0, 3)}
                        active={rule.days.includes(Number(day.key))}
                        onPress={() => {
                          const next = { ...rule, days: [...rule.days] };
                          toggleRuleDay(next, Number(day.key));
                          updateRule(service, rule.id, { days: next.days });
                        }}
                      />
                    ))}
                  </View>
                  <View style={styles.ruleFields}>
                    <View style={styles.ruleTime}>
                      <Text style={styles.label}>{t('Das')}</Text>
                      <View style={styles.timeRow}>
                        <TimeField
                          label={t('A partir das')}
                          value={rule.start === DAY_START ? '' : rule.start}
                          disabled={rule.start === DAY_START}
                          onChange={(start) => updateRule(service, rule.id, { start })}
                        />
                        <Toggle
                          label={t('Início do dia')}
                          checked={rule.start === DAY_START}
                          onChange={() =>
                            updateRule(service, rule.id, {
                              start: rule.start === DAY_START ? '' : DAY_START,
                            })
                          }
                        />
                      </View>
                    </View>
                    <View style={styles.ruleTime}>
                      <Text style={styles.label}>{t('Até')}</Text>
                      <View style={styles.timeRow}>
                        <TimeField
                          label={t('Até as')}
                          value={rule.end === DAY_END ? '' : rule.end}
                          disabled={rule.end === DAY_END}
                          onChange={(end) => updateRule(service, rule.id, { end })}
                        />
                        <Toggle
                          label={t('Fim do dia')}
                          checked={rule.end === DAY_END}
                          onChange={() =>
                            updateRule(service, rule.id, {
                              end: rule.end === DAY_END ? '' : DAY_END,
                            })
                          }
                        />
                      </View>
                    </View>
                    <View style={styles.ruleTime}>
                      <Text style={styles.label}>{t('Preço (R$)')}</Text>
                      <View style={styles.timeRow}>
                        <TextInput
                          accessibilityLabel={t('Preço (R$)')}
                          value={rule.price}
                          onChangeText={(text) =>
                            updateRule(service, rule.id, { price: maskMoney(text) })
                          }
                          keyboardType="number-pad"
                          style={[styles.input, styles.ruleInput, styles.half]}
                        />
                        <View style={styles.toggle} />
                      </View>
                    </View>
                  </View>
                  {tried && !isRuleComplete(rule) ? (
                    <Text style={styles.error}>
                      {t('Escolha os dias, um horário de início antes do fim e um preço.')}
                    </Text>
                  ) : null}
                  <Button
                    variant="danger"
                    label={t('Remover')}
                    onPress={() =>
                      update(service.id, {
                        priceRules: service.priceRules.filter((r) => r.id !== rule.id),
                      })
                    }
                  />
                </View>
              ))}
              <Button
                variant="outline"
                label={t('Adicionar preço por dia e horário')}
                onPress={() =>
                  update(service.id, { priceRules: [...service.priceRules, newRuleDraft()] })
                }
              />
              {service.priceRules.length ? null : (
                <Text style={styles.muted}>
                  {t(
                    'Ex: aos sábados o serviço custa mais. O preço vale pelo horário de início do atendimento.',
                  )}
                </Text>
              )}
            </View>

            {/* Photos of the service: the card on the professional page shows them as a gallery */}
            <Text style={styles.label}>{t('Fotos do serviço')}</Text>
            {service.photos.length ? (
              <View style={styles.chips}>
                {service.photos.map((photo) => (
                  <View key={photo} style={styles.photo}>
                    <Image
                      accessibilityIgnoresInvertColors
                      source={{ uri: photo }}
                      contentFit="cover"
                      style={styles.photoImage}
                    />
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t('Remover foto')}
                      hitSlop={6}
                      onPress={() => {
                        onDiscard([photo]);
                        update(service.id, { photos: service.photos.filter((p) => p !== photo) });
                      }}
                      style={styles.photoRemove}
                    >
                      <MaterialIcons name="close" size={16} color={fixed.white} />
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : null}

            <Button
              variant="outline"
              label={t('Adicionar fotos')}
              loading={uploading}
              onPress={() =>
                void onAddPhoto().then((url) => {
                  if (url) update(service.id, { photos: [...service.photos, url] });
                })
              }
            />

            <Field label={t('Descrição')}>
              <TextInput
                accessibilityLabel={t('Descrição')}
                value={service.description}
                onChangeText={(description) => update(service.id, { description })}
                multiline
                maxLength={1000}
                style={[styles.input, styles.multiline]}
              />
            </Field>

            <View style={styles.removeGap}>
              <Button
                variant="danger"
                label={t('Remover serviço')}
                onPress={() => remove(service)}
              />
            </View>
          </View>
        );
      })}
      <Button
        variant="outline"
        label={t('Adicionar serviço')}
        onPress={() => onChange([...services, newServiceDraft()])}
      />
    </View>
  );
}

const useStyles = () => {
  const theme = useTheme();
  return useMemo(() => makeStyles(theme), [theme]);
};

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    wrap: { gap: 12 },
    heading: { fontSize: 18, fontWeight: '700', color: theme.text },
    card: {
      gap: 10,
      padding: 14,
      borderWidth: 1,
      borderColor: fixed.borderSoft,
      borderRadius: 14,
      backgroundColor: fixed.white,
    },
    cardMissing: { borderColor: fixed.danger },
    field: { gap: 6 },
    label: { fontWeight: '600', color: theme.text },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    half: { flex: 1 },
    input: {
      minHeight: 48,
      paddingHorizontal: 16,
      borderWidth: 1.5,
      borderColor: 'transparent',
      borderRadius: 14,
      backgroundColor: theme.field,
      fontSize: 16,
      color: fixed.ink,
    },
    small: { flex: 1, textAlign: 'center' },
    multiline: { minHeight: 80, textAlignVertical: 'top', paddingTop: 10 },
    rules: { gap: 10 },
    rule: { gap: 10, padding: 12, borderWidth: 1, borderRadius: 12 },
    ruleDays: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    ruleFields: { gap: 12 },
    ruleTime: { gap: 6 },
    timeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    toggle: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
    toggleText: { flex: 1, color: theme.text },
    ruleInput: { minHeight: 44, paddingHorizontal: 12 },
    photo: { width: 96, height: 96 },
    photoImage: { flex: 1, borderRadius: 12, backgroundColor: fixed.surface },
    photoRemove: {
      position: 'absolute',
      top: 6,
      right: 6,
      width: 26,
      height: 26,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    removeGap: { marginTop: 14 },
    muted: { color: theme.muted },
    error: { color: theme.errorFg, fontSize: 13 },
  });
