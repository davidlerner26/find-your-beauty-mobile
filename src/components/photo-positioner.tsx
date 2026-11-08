import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import { PanResponder, Pressable, StyleSheet, View } from 'react-native';
import { t } from '../i18n';
import { ImagePosition } from '../models/professional';
import { fixed, radius } from '../theme/colors';
import { useTheme } from '../theme/theme';
import { focusPosition } from '../utils/labels';
import { dragPosition } from '../utils/photo-position';
import { Text } from './text';

type Props = {
  src: string;
  position: ImagePosition;
  onChange: (position: ImagePosition) => void;
};

// Drag the photo inside the frame to choose which part of it shows when it is cropped, with the three places it is
// used (messages, card, top of the page) below, like the site
export function PhotoPositioner({ src, position, onChange }: Props) {
  const theme = useTheme();
  const [frame, setFrame] = useState({ width: 0, height: 0 });
  const [photo, setPhoto] = useState({ width: 0, height: 0 });
  // The responder is created once, so what it reads lives in a ref that is updated after each render
  // The responder is created once; it reads the latest values (and where the drag began) from these refs only when
  // a touch happens, never while rendering
  const latest = useRef({ position, frame, photo, onChange });
  const start = useRef(position);
  // eslint-disable-next-line react-hooks/refs -- the refs are only read inside the touch handlers
  const [responder] = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      // A drag of the photo must not scroll the screen
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        start.current = latest.current.position;
      },
      onPanResponderMove: (_, gesture) => {
        const now = latest.current;
        now.onChange(
          dragPosition(start.current, { dx: gesture.dx, dy: gesture.dy }, now.frame, now.photo),
        );
      },
    }),
  );
  useEffect(() => {
    latest.current = { position, frame, photo, onChange };
  });

  const focus = focusPosition(position);

  return (
    <View style={styles.wrap}>
      <View
        accessibilityLabel={t('Enquadramento da foto. Arraste para mover.')}
        onLayout={(event) => setFrame(event.nativeEvent.layout)}
        style={[styles.frame, { backgroundColor: theme.primaryLight }]}
        {...responder.panHandlers}
      >
        <Image
          accessibilityIgnoresInvertColors
          source={{ uri: src }}
          contentFit="cover"
          contentPosition={focus}
          onLoad={(event) => setPhoto(event.source)}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <Text style={styles.hint}>{t('Arraste para ajustar')}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('Centralizar foto')}
          onPress={() => onChange({ x: 50, y: 50 })}
          style={styles.center}
        >
          <MaterialIcons name="my-location" size={20} color={fixed.white} />
        </Pressable>
      </View>

      <View style={styles.previews}>
        <View style={styles.item}>
          <Image
            accessibilityIgnoresInvertColors
            source={{ uri: src }}
            contentFit="cover"
            contentPosition={focus}
            style={styles.circle}
          />
          <Text style={[styles.caption, { color: theme.muted }]}>{t('Mensagens')}</Text>
        </View>
        <View style={styles.item}>
          <Image
            accessibilityIgnoresInvertColors
            source={{ uri: src }}
            contentFit="cover"
            contentPosition={focus}
            style={styles.card}
          />
          <Text style={[styles.caption, { color: theme.muted }]}>{t('Card')}</Text>
        </View>
        <View style={[styles.item, styles.grow]}>
          <Image
            accessibilityIgnoresInvertColors
            source={{ uri: src }}
            contentFit="cover"
            contentPosition={focus}
            style={styles.strip}
          />
          <Text style={[styles.caption, { color: theme.muted }]}>{t('Topo da página')}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  frame: { width: '100%', aspectRatio: 16 / 9, overflow: 'hidden', borderRadius: 16 },
  hint: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: 12,
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    color: fixed.white,
    fontSize: 13,
  },
  center: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  previews: { flexDirection: 'row', alignItems: 'flex-end', gap: 16 },
  item: { gap: 5 },
  grow: { flex: 1 },
  caption: { fontSize: 13 },
  circle: { width: 64, height: 64, borderRadius: 32 },
  card: { width: 88, height: 64, borderRadius: radius.card },
  strip: { width: '100%', height: 64, borderRadius: radius.card },
});
