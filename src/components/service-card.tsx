import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from './text';
import { t } from '../i18n';
import { formatDuration, Service } from '../models/professional';
import { fixed } from '../theme/colors';
import { useTheme } from '../theme/theme';
import { catalogLabel } from '../utils/catalog';
import { formatPrice } from '../utils/money';
import { ruleLabel } from '../utils/pricing';
import { CardSurface } from './card-surface';
import { PhotoPager } from './photo-pager';

const PHOTO = 136;

// A service of the professional, like the site: photos on the left, name, price and duration, the prices by day and
// time and the description, and a round button on the corner to add it to the booking (or take it out)
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
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  // The photos have the height of the card; the card has the height of the text
  const [height, setHeight] = useState(150);
  const long = service.description.length > 90;
  const hasPhotos = !!service.photos?.length;
  const name = catalogLabel(service.name);

  return (
    <CardSurface>
      {hasPhotos ? (
        <View style={styles.photos}>
          <PhotoPager photos={service.photos ?? []} width={PHOTO} height={height} label={name} />
        </View>
      ) : null}
      <View
        style={[styles.info, hasPhotos && { marginLeft: PHOTO }]}
        onLayout={(e) => setHeight(Math.round(e.nativeEvent.layout.height))}
      >
        <View style={styles.text}>
          <Text accessibilityRole="header" numberOfLines={2} style={styles.name}>
            {name}
          </Text>
          <Text style={{ color: theme.primary }}>
            <Text style={styles.price}>{formatPrice(service.price)}</Text>
            <Text style={styles.muted}> · {formatDuration(service.durationMinutes)}</Text>
          </Text>
          {service.priceRules?.map((rule, n) => (
            <Text key={n} style={styles.rule}>
              {ruleLabel(rule)}: <Text style={styles.price}>{formatPrice(rule.price)}</Text>
            </Text>
          ))}
          {service.description ? (
            <>
              <Text style={styles.description} numberOfLines={open ? undefined : 2}>
                {service.description}
              </Text>
              {long ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={open ? t('Ler menos') : t('Ler mais')}
                  onPress={() => setOpen((current) => !current)}
                >
                  <Text style={[styles.readMore, { color: theme.primary }]}>
                    {open ? t('Ler menos') : t('Ler mais')}
                  </Text>
                </Pressable>
              ) : null}
            </>
          ) : null}
        </View>
        {onToggle ? (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: !!selected }}
            accessibilityLabel={
              selected ? t('Remover {{name}}', { name }) : t('Adicionar {{name}}', { name })
            }
            onPress={onToggle}
            style={[
              styles.toggle,
              selected
                ? { backgroundColor: fixed.white, borderColor: fixed.danger }
                : { backgroundColor: theme.primary, borderColor: theme.primary },
            ]}
          >
            <Text style={[styles.toggleText, { color: selected ? fixed.danger : fixed.white }]}>
              {selected ? '−' : '+'}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </CardSurface>
  );
}

const styles = StyleSheet.create({
  photos: { position: 'absolute', left: 0, top: 0, width: PHOTO },
  info: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 12, padding: 16 },
  text: { flex: 1, gap: 4 },
  name: { fontSize: 17, fontWeight: '700', color: fixed.ink },
  price: { fontWeight: '700' },
  muted: { color: fixed.gray },
  rule: { color: fixed.gray, fontSize: 14 },
  description: { color: fixed.gray, fontSize: 14 },
  readMore: { fontSize: 14, fontWeight: '600' },
  toggle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleText: { fontSize: 24, lineHeight: 28 },
});
