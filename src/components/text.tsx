import {
  StyleProp,
  StyleSheet,
  Text as NativeText,
  TextInput as NativeTextInput,
  TextInputProps,
  TextProps,
  TextStyle,
} from 'react-native';
import { fontFamilyFor } from '../theme/fonts';

// The text of the app: Mulish, like the site. Everything draws its text with these two, so the weight in a style
// (`fontWeight: '700'`) picks the file of the font (a custom font has one file per weight).
export const withFont = (style: StyleProp<TextStyle>): StyleProp<TextStyle> => {
  const { fontWeight } = StyleSheet.flatten(style) ?? {};
  return [style, { fontFamily: fontFamilyFor(fontWeight), fontWeight: undefined }];
};

export function Text({ style, ...props }: TextProps) {
  return <NativeText {...props} style={withFont(style)} />;
}

export function TextInput({ style, ...props }: TextInputProps) {
  return <NativeTextInput {...props} style={withFont(style)} />;
}
