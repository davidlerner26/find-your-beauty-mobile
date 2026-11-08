import { ReactNode, useEffect, useRef, useState } from 'react';
import { ScrollView, ScrollViewInstance, StyleProp, ViewStyle } from 'react-native';

type Props = {
  children: ReactNode;
  // The item that stays in the middle of the screen (-1: none, the strip stays at the start)
  index: number;
  itemWidth: number;
  gap: number;
  // The room at the start and at the end of the strip
  padding: number;
  style?: StyleProp<ViewStyle>;
};

// A strip of equal items (the days of a calendar) that scrolls sideways and brings one of them to the center
export function CenteredStrip({ children, index, itemWidth, gap, padding, style }: Props) {
  const strip = useRef<ScrollViewInstance>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!width) return;
    const middle = padding + Math.max(index, 0) * (itemWidth + gap) + itemWidth / 2;
    strip.current?.scrollTo({ x: index < 0 ? 0 : Math.max(0, middle - width / 2), animated: true });
  }, [index, width, itemWidth, gap, padding]);

  return (
    <ScrollView
      ref={strip}
      horizontal
      showsHorizontalScrollIndicator={false}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={style}
      contentContainerStyle={{ gap, paddingHorizontal: padding }}
    >
      {children}
    </ScrollView>
  );
}
