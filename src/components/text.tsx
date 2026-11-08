import {
  StyleProp,
  StyleSheet,
  Text as NativeText,
  TextInput as NativeTextInput,
  TextInputProps,
  TextProps,
  TextStyle,
} from 'react-native';
import { fixed, Theme } from '../theme/colors';
import { fontFamilyFor } from '../theme/fonts';
import { useTheme } from '../theme/theme';

// The text of the app: Mulish, like the site. Everything draws its text with these two, so the weight in a style
// (`fontWeight: '700'`) picks the file of the font (a custom font has one file per weight).
export const withFont = (style: StyleProp<TextStyle>): StyleProp<TextStyle> => {
  const { fontWeight } = StyleSheet.flatten(style) ?? {};
  return [style, { fontFamily: fontFamilyFor(fontWeight), fontWeight: undefined }];
};

// In the professional area (blue) the letters are white: the colors that screens write for the light background (the
// ink, the gray and the copper of the links) become the ones of the theme. The other colors stay as they are: the
// blue of the brand too, because it is the color of the letters on the white buttons and pills of that area.
export const themedStyle = (style: StyleProp<TextStyle>, theme: Theme): StyleProp<TextStyle> => {
  if (theme.name !== 'pro') return style;
  const { color } = StyleSheet.flatten(style) ?? {};
  const swap =
    color === fixed.ink || color === fixed.accentText
      ? theme.text
      : color === fixed.gray
        ? theme.muted
        : undefined;
  return swap ? [style, { color: swap }] : style;
};

export function Text({ style, ...props }: TextProps) {
  const theme = useTheme();
  return <NativeText {...props} style={withFont(themedStyle(style, theme))} />;
}

export function TextInput({ style, ...props }: TextInputProps) {
  const theme = useTheme();
  // The fields keep a light background in the professional area (their letters stay dark)
  const base = theme.name === 'pro' ? { backgroundColor: fixed.white } : undefined;
  return <NativeTextInput {...props} style={withFont([base, style])} />;
}
