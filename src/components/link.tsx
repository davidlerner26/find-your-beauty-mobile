import { Link as RouterLink } from 'expo-router';
import { ComponentProps } from 'react';
import { StyleProp, TextStyle } from 'react-native';
import { withFont } from './text';

// The Link of expo-router, in the font of the app (its text is drawn by the native Text, which has no Mulish)
export function Link({ style, ...props }: ComponentProps<typeof RouterLink>) {
  return <RouterLink {...props} style={withFont(style as StyleProp<TextStyle>) as never} />;
}
