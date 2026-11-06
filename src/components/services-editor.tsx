import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { t } from '../i18n';
import { ServiceCategory } from '../models/professional';
import { fixed } from '../theme/colors';
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
import { maskTime } from './availability-editor';
import { Button } from './button';
import { Chip } from './chip';

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
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {error ? <Text style={styles.error}>{t('Obrigatório')}</Text> : null}
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
          <View key={service.id} style={[styles.card, missing && styles.cardMissing]}>
            <Field label={t('Categoria')} error={missing && !service.category}>
              <View style={styles.chips}>
                {CATEGORIES.map((category) => (
                  <Chip
                    key={category}
                    label={catalogLabel(category)}
                    active={service.category === category}
                    onPress={() => {
                      const next = { ...service };
                      setCategory(next, category);
                      update(service.id, { category: next.category, name: next.name });
                    }}
                  />
                ))}
              </View>
            </Field>

            {service.category ? (
              <Field label={t('Serviço')} error={missing && !service.name.trim()}>
                <View style={styles.chips}>
                  {serviceNamesOf(service).map((name) => (
                    <Chip
                      key={name}
                      label={catalogLabel(name)}
                      active={service.name === name}
                      onPress={() => update(service.id, { name })}
                    />
                  ))}
                </View>
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

            <Field label={t('Descrição (opcional)')}>
              <TextInput
                accessibilityLabel={t('Descrição (opcional)')}
                value={service.description}
                onChangeText={(description) => update(service.id, { description })}
                multiline
                maxLength={500}
                style={[styles.input, styles.multiline]}
              />
            </Field>

            <Text style={styles.label}>{t('Outros preços, por dia e horário')}</Text>
            {service.priceRules.map((rule) => (
              <View key={rule.id} style={styles.rule}>
                <View style={styles.chips}>
                  {WEEKDAYS.map((day) => (
                    <Chip
                      key={day.key}
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
                <View style={styles.row}>
                  <TextInput
                    accessibilityLabel={t('A partir das')}
                    value={rule.start}
                    onChangeText={(text) => updateRule(service, rule.id, { start: maskTime(text) })}
                    placeholder="18:00"
                    keyboardType="number-pad"
                    maxLength={5}
                    style={[styles.input, styles.small]}
                  />
                  <Text style={styles.muted}>{t('às')}</Text>
                  <TextInput
                    accessibilityLabel={t('Até as')}
                    value={rule.end}
                    onChangeText={(text) => updateRule(service, rule.id, { end: maskTime(text) })}
                    placeholder="22:00"
                    keyboardType="number-pad"
                    maxLength={5}
                    style={[styles.input, styles.small]}
                  />
                  <TextInput
                    accessibilityLabel={t('Preço (R$)')}
                    value={rule.price}
                    onChangeText={(text) =>
                      updateRule(service, rule.id, { price: maskMoney(text) })
                    }
                    keyboardType="number-pad"
                    style={[styles.input, styles.small]}
                  />
                </View>
                {tried && !isRuleComplete(rule) ? (
                  <Text style={styles.error}>
                    {t('Escolha os dias, um horário de início antes do fim e um preço.')}
                  </Text>
                ) : null}
                <Button
                  variant="link"
                  label={t('Remover preço')}
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

            <Text style={styles.label}>{t('Fotos do serviço')}</Text>
            <View style={styles.chips}>
              {service.photos.map((photo) => (
                <Pressable
                  key={photo}
                  accessibilityRole="button"
                  accessibilityLabel={t('Remover foto')}
                  onPress={() => {
                    onDiscard([photo]);
                    update(service.id, { photos: service.photos.filter((p) => p !== photo) });
                  }}
                >
                  <Image
                    accessibilityIgnoresInvertColors
                    source={{ uri: photo }}
                    contentFit="cover"
                    style={styles.photo}
                  />
                </Pressable>
              ))}
            </View>
            <Button
              variant="outline"
              label={t('Adicionar foto')}
              loading={uploading}
              onPress={() =>
                void onAddPhoto().then((url) => {
                  if (url) update(service.id, { photos: [...service.photos, url] });
                })
              }
            />

            <Button variant="link" label={t('Remover serviço')} onPress={() => remove(service)} />
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

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  heading: { fontSize: 20, fontWeight: '700', color: fixed.ink },
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
  label: { fontWeight: '600', color: fixed.ink },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  half: { flex: 1 },
  input: {
    minHeight: 44,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: fixed.border,
    borderRadius: 10,
    fontSize: 16,
    color: fixed.ink,
  },
  small: { flex: 1, textAlign: 'center' },
  multiline: { minHeight: 80, textAlignVertical: 'top', paddingTop: 10 },
  rule: { gap: 8, padding: 10, borderRadius: 10, backgroundColor: fixed.surface },
  photo: { width: 72, height: 72, borderRadius: 10, backgroundColor: fixed.surface },
  muted: { color: fixed.gray },
  error: { color: fixed.dangerStrong, fontSize: 13 },
});
