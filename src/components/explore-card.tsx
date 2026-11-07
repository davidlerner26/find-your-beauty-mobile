import { Pressable, StyleSheet, View } from 'react-native';
import { fixed, radius } from '../theme/colors';
import { useTheme } from '../theme/theme';
import { catalogText } from '../utils/catalog';
import { Card } from '../utils/search-filter';
import { CardSurface } from './card-surface';
import { HeartButton } from './heart-button';
import { PhotoPager } from './photo-pager';
import { Rating } from './rating';
import { Text } from './text';
import { t } from '../i18n';

const PHOTO = 144;
export const EXPLORE_CARD_HEIGHT = 152;

// A professional of the map: photos on the left, text on the right. Selected, it has a copper border.
export function ExploreCard({
  card,
  selected,
  width,
  onPress,
}: {
  card: Card;
  selected?: boolean;
  width?: number;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.frame, { width }, selected && styles.selected]}>
      <CardSurface>
        <View style={styles.photo}>
          <PhotoPager
            photos={card.photos}
            focusPhoto={card.cardImage}
            focus={card.cardPosition}
            width={PHOTO}
            height={EXPLORE_CARD_HEIGHT}
            label={card.name}
            onPressPhoto={onPress}
          />
          <HeartButton professionalId={card.id} />
          {card.distance ? <Text style={styles.distance}>{card.distance}</Text> : null}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={card.name}
          accessibilityHint={selected ? t('Abrir o perfil') : t('Mostrar no mapa')}
          onPress={onPress}
          style={styles.info}
        >
          <Text numberOfLines={1} style={[styles.tags, { color: theme.primary }]}>
            {catalogText(card.tags)}
          </Text>
          <Text numberOfLines={2} style={styles.name}>
            {card.name}
          </Text>
          <Text numberOfLines={2} style={styles.muted}>
            {card.shortAddress}
          </Text>
          <View style={styles.rating}>
            <Rating rating={card.rating} count={card.reviewsCount} />
          </View>
        </Pressable>
      </CardSurface>
    </View>
  );
}

const styles = StyleSheet.create({
  // A border that is always there (transparent), so selecting does not move the card
  frame: {
    borderRadius: radius.card + 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selected: { borderColor: fixed.accent },
  photo: { width: PHOTO, height: EXPLORE_CARD_HEIGHT },
  info: { flex: 1, minWidth: 0, padding: 14, gap: 2 },
  tags: { fontSize: 13 },
  name: { fontSize: 17, fontWeight: '700', color: fixed.ink },
  muted: { color: fixed.gray, fontSize: 14 },
  rating: { marginTop: 'auto' },
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
