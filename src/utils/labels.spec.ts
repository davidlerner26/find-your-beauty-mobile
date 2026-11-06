import { reviewsLabel, viewsLabel } from './labels';

describe('reviewsLabel', () => {
  it('is singular only for 1', () => {
    expect(reviewsLabel(1)).toBe('avaliação');
    expect(reviewsLabel('1')).toBe('avaliação');
    expect(reviewsLabel(0)).toBe('avaliações');
    expect(reviewsLabel('12')).toBe('avaliações');
    expect(reviewsLabel(null)).toBe('avaliações');
  });
});

describe('viewsLabel', () => {
  it('is singular only for 1', () => {
    expect(viewsLabel(1)).toBe('visualização');
    expect(viewsLabel(0)).toBe('visualizações');
    expect(viewsLabel('3')).toBe('visualizações');
  });
});
