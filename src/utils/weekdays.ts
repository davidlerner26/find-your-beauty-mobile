import { t } from '../i18n';
// Monday first, as in the Brazilian calendar. `key` is Date#getDay.
export const WEEKDAYS = [
  { key: '1', label: t('Segunda') },
  { key: '2', label: t('Terça') },
  { key: '3', label: t('Quarta') },
  { key: '4', label: t('Quinta') },
  { key: '5', label: t('Sexta') },
  { key: '6', label: t('Sábado') },
  { key: '0', label: t('Domingo') },
];
