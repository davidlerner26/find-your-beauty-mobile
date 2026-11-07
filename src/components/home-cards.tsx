import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { fixed, radius } from '../theme/colors';
import { useTheme } from '../theme/theme';
import { catalogText } from '../utils/catalog';
import { PATHS } from '../utils/paths';
import { Card } from '../utils/search-filter';
import { HeartButton } from './heart-button';
import { Link } from './link';
import { PhotoPager } from './photo-pager';
import { Rating } from './rating';
import { Text } from './text';

// Same measures as the home of the site: the card is 18rem wide (the next one peeks in on phones)
export const FEATURED_GAP = 16;
const SIDES = 24;

// Width of a card of the "Profissionais em destaque" carousel: min(18rem, screen - 5rem)
export const featuredWidth = (screen: number) => Math.min(288, screen - 80);

function Info({ card }: { card: Card }) {
  const theme = useTheme();
  return (
    <Link href={PATHS.professional(card.id) as never} accessibilityLabel={card.name}>
      <View style={styles.info}>
        <Text style={[styles.tags, { color: theme.primary }]}>{catalogText(card.tags)}</Text>
        <Text style={styles.name}>{card.name}</Text>
        <Text style={styles.muted}>{card.shortAddress}</Text>
        <View style={styles.rating}>
          <Rating rating={card.rating} count={card.reviewsCount} />
        </View>
      </View>
    </Link>
  );
}

// A card of the carousel of featured professionals: photo on top, text below
export function FeaturedCard({ card }: { card: Card }) {
  const { width: screen } = useWindowDimensions();
  const width = featuredWidth(screen);
  return (
    <View style={{ width }}>
      <View style={styles.featuredPhoto}>
        <PhotoPager
          photos={card.photos}
          focusPhoto={card.image}
          focus={card.cardPosition}
          width={width}
          height={240}
          label={card.name}
        />
        <HeartButton professionalId={card.id} />
      </View>
      <Info card={card} />
    </View>
  );
}

// A card of "Profissionais próximos": photo on the left (9rem), text on the right
export function NearbyCard({ card }: { card: Card }) {
  const { width: screen } = useWindowDimensions();
  const photo = 144;
  return (
    <View style={styles.nearby}>
      <View style={{ width: photo }}>
        <PhotoPager
          photos={card.photos}
          focusPhoto={card.image}
          focus={card.cardPosition}
          width={photo}
          height={Math.min(180, Math.round((screen - SIDES * 2) / 2))}
          label={card.name}
        />
        <HeartButton professionalId={card.id} />
        {card.distance ? <Text style={styles.distance}>{card.distance}</Text> : null}
      </View>
      <View style={styles.nearbyInfo}>
        <Info card={card} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  featuredPhoto: { borderRadius: radius.card, overflow: 'hidden', marginBottom: 12 },
  info: { gap: 4 },
  tags: { fontSize: 13 },
  name: { fontSize: 18, fontWeight: '700', color: fixed.ink },
  muted: { color: fixed.gray },
  rating: { marginTop: 8 },
  nearby: {
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
  nearbyInfo: { flex: 1, padding: 16 },
  distance: {
    position: 'absolute',
    left: 0,
    bottom: 28,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
    backgroundColor: fixed.warningBg,
    color: fixed.accentText,
    fontSize: 13,
  },
});
