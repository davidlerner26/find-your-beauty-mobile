import { Image } from 'expo-image';
import { useState } from 'react';
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { fixed } from '../theme/colors';
import { focusPosition } from '../utils/labels';

type Props = {
  photos: string[];
  // The photo that has a focal point (the profile photo), and the point
  focusPhoto?: string;
  focus?: { x: number; y: number };
  width: number;
  height: number;
  label: string;
  style?: ViewStyle;
  // Called when a photo is tapped
  onPressPhoto?: (index: number) => void;
};

// Photos side by side that snap one by one, with dots (the carousels of the cards and of the professional page)
export function PhotoPager({
  photos,
  focusPhoto,
  focus,
  width,
  height,
  label,
  style,
  onPressPhoto,
}: Props) {
  const [index, setIndex] = useState(0);
  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) =>
    setIndex(Math.round(event.nativeEvent.contentOffset.x / width));

  return (
    <View style={[{ width, height, backgroundColor: fixed.surface }, style]}>
      <FlatList
        data={photos}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(photo, n) => `${n}-${photo}`}
        onMomentumScrollEnd={onScroll}
        getItemLayout={(_, n) => ({ length: width, offset: width * n, index: n })}
        renderItem={({ item, index: n }) => (
          <Image
            accessibilityIgnoresInvertColors
            source={{ uri: item }}
            accessibilityLabel={label}
            contentFit="cover"
            contentPosition={focusPosition(item === focusPhoto ? focus : undefined)}
            transition={150}
            onTouchEnd={onPressPhoto ? () => onPressPhoto(n) : undefined}
            style={{ width, height }}
          />
        )}
      />
      {photos.length > 1 ? (
        <View style={styles.dots} accessibilityElementsHidden importantForAccessibility="no">
          {photos.map((photo, n) => (
            <View key={`${n}-${photo}`} style={[styles.dot, n === index && styles.dotOn]} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  dots: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.6)' },
  dotOn: { backgroundColor: fixed.white },
});
