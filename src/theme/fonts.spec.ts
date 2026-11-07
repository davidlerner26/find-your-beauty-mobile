import { fontFamilyFor } from './fonts';

describe('fontFamilyFor', () => {
  it('picks the file of the weight', () => {
    expect(fontFamilyFor(undefined)).toBe('Mulish_400Regular');
    expect(fontFamilyFor('normal')).toBe('Mulish_400Regular');
    expect(fontFamilyFor('300')).toBe('Mulish_400Regular');
    expect(fontFamilyFor('500')).toBe('Mulish_500Medium');
    expect(fontFamilyFor('600')).toBe('Mulish_600SemiBold');
    expect(fontFamilyFor('700')).toBe('Mulish_700Bold');
    expect(fontFamilyFor('bold')).toBe('Mulish_700Bold');
    expect(fontFamilyFor(800)).toBe('Mulish_800ExtraBold');
  });
});
