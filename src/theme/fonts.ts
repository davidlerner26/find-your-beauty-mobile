import {
  Mulish_400Regular,
  Mulish_500Medium,
  Mulish_600SemiBold,
  Mulish_700Bold,
  Mulish_800ExtraBold,
} from '@expo-google-fonts/mulish';

// The files of the font to load (the site uses Mulish)
export const FONTS = {
  Mulish_400Regular,
  Mulish_500Medium,
  Mulish_600SemiBold,
  Mulish_700Bold,
  Mulish_800ExtraBold,
};

// The family that has the weight of a style: 'normal' and the light ones are regular, 'bold' is 700, the heaviest
// are extra bold
export const fontFamilyFor = (weight: string | number | undefined) => {
  const value =
    weight === 'bold' ? 700 : weight === 'normal' || weight === undefined ? 400 : Number(weight);
  if (value >= 800) return 'Mulish_800ExtraBold';
  if (value >= 700) return 'Mulish_700Bold';
  if (value >= 600) return 'Mulish_600SemiBold';
  if (value >= 500) return 'Mulish_500Medium';
  return 'Mulish_400Regular';
};
