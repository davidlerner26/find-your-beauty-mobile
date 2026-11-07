import { useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Text } from './text';
import { t } from '../i18n';
import { formatDuration, Service } from '../models/professional';
import { fixed } from '../theme/colors';
import { catalogLabel } from '../utils/catalog';
import { formatPrice } from '../utils/money';
import { ruleLabel } from '../utils/pricing';
import { PhotoPager } from './photo-pager';

// A service of the professional: photos, name, price, duration, the prices by day and time, and the description
export function ServiceCard({
  service,
  selected,
  onToggle,
}: {
  service: Service;
  // The client picks the services to book: without `onToggle` the card only shows the service
  selected?: boolean;
  onToggle?: () => void;
}) {
  const { width: screen } = useWindowDimensions();
  const [open, setOpen] = useState(false);
  const width = screen - 32;
  const long = service.description.length > 140;

  return (
    <View style={[styles.card, selected && styles.cardOn]}>
      {service.photos?.length ? (
        <PhotoPager
          photos={service.photos}
          width={width - 2}
          height={Math.round(width * 0.5)}
          label={catalogLabel(service.name)}
        />
      ) : null}
      <View style={styles.body}>
        <Text accessibilityRole="header" style={styles.name}>
          {catalogLabel(service.name)}
        </Text>
        <Text style={styles.muted}>
          <Text style={styles.price}>{formatPrice(service.price)}</Text> ·{' '}
          {formatDuration(service.durationMinutes)}
        </Text>
        {service.priceRules?.map((rule, n) => (
          <Text key={n} style={styles.muted}>
            {ruleLabel(rule)}: <Text style={styles.price}>{formatPrice(rule.price)}</Text>
          </Text>
        ))}
        {service.description ? (
          <>
            <Text style={styles.muted} numberOfLines={open ? undefined : 3}>
              {service.description}
            </Text>
            {long ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={open ? t('Ler menos') : t('Ler mais')}
                onPress={() => setOpen((current) => !current)}
              >
                <Text style={styles.link}>{open ? t('Ler menos') : t('Ler mais')}</Text>
              </Pressable>
            ) : null}
          </>
        ) : null}
        {onToggle ? (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: !!selected }}
            accessibilityLabel={
              selected
                ? t('Remover {{name}}', { name: catalogLabel(service.name) })
                : t('Adicionar {{name}}', { name: catalogLabel(service.name) })
            }
            onPress={onToggle}
            style={[styles.pick, selected && styles.pickOn]}
          >
            <Text style={[styles.pickText, selected && { color: fixed.white }]}>
              {selected ? t('Selecionado') : t('Selecionar')}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: fixed.borderSoft,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: fixed.white,
  },
  cardOn: { borderColor: fixed.brand, borderWidth: 2 },
  pick: {
    marginTop: 6,
    minHeight: 42,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: fixed.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickOn: { backgroundColor: fixed.brand },
  pickText: { color: fixed.brand, fontWeight: '600' },
  body: { padding: 14, gap: 4 },
  name: { fontSize: 16, fontWeight: '700', color: fixed.ink },
  price: { fontWeight: '700', color: fixed.ink },
  muted: { color: fixed.gray },
  link: { color: fixed.accentText, fontWeight: '600', paddingVertical: 4 },
});
