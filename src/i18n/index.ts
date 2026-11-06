import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import { APP_LANGUAGE } from '../utils/locale';
import { en } from './en';
import { es } from './es';

// Same idea as the site: Portuguese is the source language and its text is the key (like `$localize`). A text with
// no translation is shown as written, so `pt` needs no file. Translations are added to en.ts and es.ts.
const i18n = createInstance();
void i18n.use(initReactI18next).init({
  lng: APP_LANGUAGE,
  fallbackLng: false,
  resources: { en: { translation: en }, es: { translation: es } },
  keySeparator: false,
  nsSeparator: false,
  interpolation: { escapeValue: false },
  initAsync: false,
  returnEmptyString: false,
});

export const t = (text: string, values?: Record<string, string | number>) => i18n.t(text, values);

export default i18n;
