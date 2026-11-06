import { useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { t } from '../i18n';
import { formatDuration, Service } from '../models/professional';
import { fixed } from '../theme/colors';
import { catalogLabel } from '../utils/catalog';
import { formatPrice } from '../utils/money';
import { ruleLabel } from '../utils/pricing';
import { PhotoPager } from './photo-pager';

// A service of the professional: photos, name, price, duration, the prices by day and time, and the description
export function ServiceCard({ service }: { service: Service }) {
  const { width: screen } = useWindowDimensions();
  const [open, setOpen] = useState(false);
  const width = screen - 32;
  const long = service.description.length > 140;

  return (
    <View style={styles.card}>
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
  body: { padding: 14, gap: 4 },
  name: { fontSize: 16, fontWeight: '700', color: fixed.ink },
  price: { fontWeight: '700', color: fixed.ink },
  muted: { color: fixed.gray },
  link: { color: fixed.accentText, fontWeight: '600', paddingVertical: 4 },
});
