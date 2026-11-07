import { StyleSheet, View } from 'react-native';

const STEPS = 32;

// The dark gradient over a photo (clear on top, black at the bottom) without a native module: thin bands that get
// darker. `from` is where it starts (0 = top, 1 = bottom) and `max` how dark it ends.
export function Shade({ from = 0.3, max = 0.75 }: { from?: number; max?: number }) {
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { top: `${from * 100}%` }]}>
      {Array.from({ length: STEPS }, (_, n) => (
        <View
          key={n}
          style={{ flex: 1, backgroundColor: `rgba(0, 0, 0, ${(max * (n + 1)) / STEPS})` }}
        />
      ))}
    </View>
  );
}
