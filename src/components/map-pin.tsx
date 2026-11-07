import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Marker } from 'react-native-maps';
import { fixed } from '../theme/colors';

const HEAD = 36;
// The tip of a square of side HEAD turned 45 degrees is this far below the center of the head
const HEIGHT = Math.round(HEAD / 2 + (HEAD / 2) * Math.SQRT2);

// The pin of the site: a drop with a white dot (brand color; copper when selected)
export function MapPin({
  lat,
  lng,
  selected,
  onPress,
}: {
  lat: number;
  lng: number;
  selected: boolean;
  onPress: () => void;
}) {
  // A custom view is drawn into an image that the map keeps: it has to be watched again when the color changes,
  // and can be left alone after a moment (the state is adjusted while rendering, not in an effect)
  const [watching, setWatching] = useState(true);
  const [drawn, setDrawn] = useState(selected);
  if (drawn !== selected) {
    setDrawn(selected);
    setWatching(true);
  }
  useEffect(() => {
    const timer = setTimeout(() => setWatching(false), 500);
    return () => clearTimeout(timer);
  }, [selected]);

  return (
    <Marker
      coordinate={{ latitude: lat, longitude: lng }}
      anchor={{ x: 0.5, y: 1 }}
      tracksViewChanges={watching}
      zIndex={selected ? 1 : 0}
      onPress={onPress}
    >
      <View style={styles.box}>
        <View style={[styles.drop, { backgroundColor: selected ? fixed.accent : fixed.brand }]} />
        <View style={styles.dot} />
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  box: { width: HEAD, height: HEIGHT, alignItems: 'center' },
  // Three round corners and one sharp: turned, the sharp one points down
  drop: {
    width: HEAD,
    height: HEAD,
    borderRadius: HEAD / 2,
    borderBottomLeftRadius: 0,
    transform: [{ rotate: '-45deg' }],
  },
  dot: {
    position: 'absolute',
    top: HEAD / 2 - 6,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: fixed.white,
  },
});
