import { getLocales } from 'expo-localization';
import { asLang, Lang } from '../../shared/domain';

// The language of the device: 'pt' unless it is English or Spanish (the same rule as the site)
export const APP_LANGUAGE: Lang = asLang(getLocales()[0]?.languageCode);

// The locale for the dates and the numbers
export const INTL_LOCALE = { pt: 'pt-BR', en: 'en-US', es: 'es' }[APP_LANGUAGE];
