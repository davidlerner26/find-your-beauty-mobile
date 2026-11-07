import { Link as RouterLink } from 'expo-router';
import { ComponentProps } from 'react';
import { StyleProp, TextStyle } from 'react-native';
import { useTheme } from '../theme/theme';
import { themedStyle, withFont } from './text';

// The Link of expo-router, in the font of the app (its text is drawn by the native Text, which has no Mulish)
export function Link({ style, ...props }: ComponentProps<typeof RouterLink>) {
  const theme = useTheme();
  const themed = themedStyle(style as StyleProp<TextStyle>, theme);
  return <RouterLink {...props} style={withFont(themed) as never} />;
}
