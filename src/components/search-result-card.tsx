import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { t } from '../i18n';
import { fixed, radius } from '../theme/colors';
import { useTheme } from '../theme/theme';
import { catalogText } from '../utils/catalog';
import { formatPrice } from '../utils/money';
import { PATHS } from '../utils/paths';
import { Card } from '../utils/search-filter';
import { HeartButton } from './heart-button';
import { Link } from './link';
import { PhotoPager } from './photo-pager';
import { Rating } from './rating';
import { Text } from './text';

const PHOTO = 144;

// A result of the search: photos on the left (9rem, as tall as the text), text on the right
export function SearchResultCard({ card }: { card: Card }) {
  const theme = useTheme();
  // The photos are laid over the left side and have the height of the text (it sets the height of the card)
  const [height, setHeight] = useState(168);

  return (
    <View style={styles.card}>
      <View style={styles.photo}>
        <PhotoPager
          photos={card.photos}
          focusPhoto={card.cardImage}
          focus={card.cardPosition}
          width={PHOTO}
          height={height}
          label={card.name}
        />
        <HeartButton professionalId={card.id} />
      </View>
      <View
        style={styles.infoBox}
        onLayout={(e) => setHeight(Math.round(e.nativeEvent.layout.height))}
      >
        <Link href={PATHS.professional(card.id) as never} accessibilityLabel={card.name}>
          <View style={styles.info}>
            <Text style={[styles.tags, { color: theme.primary }]}>{catalogText(card.tags)}</Text>
            <Text style={styles.name}>{card.name}</Text>
            <Text style={styles.address}>{card.address}</Text>
            {card.minPrice !== null ? (
              <Text style={[styles.price, { color: theme.primary }]}>
                {t('A partir de {{price}}', { price: formatPrice(card.minPrice) })}
              </Text>
            ) : null}
            <View style={styles.rating}>
              <Rating rating={card.rating} count={card.reviewsCount} />
              {card.distance ? <Text style={styles.muted}> · {card.distance}</Text> : null}
            </View>
          </View>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: radius.card,
    overflow: 'hidden',
    backgroundColor: fixed.white,
    // --shadow-card of the site
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  photo: { position: 'absolute', left: 0, top: 0, width: PHOTO },
  infoBox: { marginLeft: PHOTO },
  info: { padding: 16, gap: 2 },
  tags: { fontSize: 13 },
  name: { fontSize: 18, fontWeight: '700', color: fixed.ink },
  address: { color: fixed.gray, fontSize: 14, marginTop: 2 },
  price: { fontSize: 14, fontWeight: '600', marginTop: 4 },
  rating: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: 8 },
  muted: { color: fixed.gray },
});
