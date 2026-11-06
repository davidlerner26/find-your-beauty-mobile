import { Link } from 'expo-router';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { t } from '../i18n';
import { fixed } from '../theme/colors';
import { catalogText } from '../utils/catalog';
import { formatPrice } from '../utils/money';
import { PATHS } from '../utils/paths';
import { Card } from '../utils/search-filter';
import { HeartButton } from './heart-button';
import { PhotoPager } from './photo-pager';
import { Rating } from './rating';

// What a card of the lists shows: photos, tags, name, address, rating and the price to start from
export function ProfessionalCard({ card, showPrice }: { card: Card; showPrice?: boolean }) {
  const { width: screen } = useWindowDimensions();
  const width = screen - 32;

  return (
    <View style={styles.card}>
      <View>
        <PhotoPager
          photos={card.photos}
          focusPhoto={card.image}
          focus={card.cardPosition}
          width={width}
          height={Math.round(width * 0.62)}
          label={card.name}
          style={styles.photos}
        />
        <HeartButton professionalId={card.id} />
        {card.distance ? <Text style={styles.distance}>{card.distance}</Text> : null}
      </View>
      <Link href={PATHS.professional(card.id) as never} accessibilityLabel={card.name}>
        <View style={styles.info}>
          <Text style={styles.tags}>{catalogText(card.tags)}</Text>
          <Text style={styles.name}>{card.name}</Text>
          <Text style={styles.muted}>{card.address}</Text>
          <Rating rating={card.rating} count={card.reviewsCount} />
          {showPrice && card.minPrice !== null ? (
            <Text style={styles.price}>
              {t('A partir de {{price}}', { price: formatPrice(card.minPrice) })}
            </Text>
          ) : null}
        </View>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: 8 },
  photos: { borderRadius: 14, overflow: 'hidden' },
  info: { gap: 2 },
  tags: { color: fixed.accentText, fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },
  name: { fontSize: 18, fontWeight: '700', color: fixed.ink },
  muted: { color: fixed.gray },
  price: { color: fixed.ink, fontWeight: '600', marginTop: 2 },
  distance: {
    position: 'absolute',
    left: 10,
    top: 10,
    backgroundColor: fixed.white,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
    fontSize: 12,
    fontWeight: '600',
    color: fixed.ink,
  },
});
