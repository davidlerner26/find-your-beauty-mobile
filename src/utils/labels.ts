import { t } from '../i18n';

// 1 -> "avaliação", anything else -> "avaliações"
export const reviewsLabel = (count: string | number | null | undefined) =>
  Number(count) === 1 ? t('avaliação') : t('avaliações');

// 1 -> "visualização", anything else (0 included) -> "visualizações"
export const viewsLabel = (count: string | number | null | undefined) =>
  Number(count) === 1 ? t('visualização') : t('visualizações');

// Focal point -> the `contentPosition` of expo-image (the `object-position` of the site). Centered by default.
export const focusPosition = (position?: { x: number; y: number } | null) => ({
  left: `${position?.x ?? 50}%` as const,
  top: `${position?.y ?? 50}%` as const,
});
