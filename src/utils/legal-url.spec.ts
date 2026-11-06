import { legalUrl } from './legal-url';

describe('legalUrl', () => {
  it('is at the root in Portuguese and under /en and /es in the other languages', () => {
    expect(legalUrl('https://findyourbeauty.com.br', 'termos', 'pt')).toBe(
      'https://findyourbeauty.com.br/termos',
    );
    expect(legalUrl('https://findyourbeauty.com.br/', 'privacidade', 'en')).toBe(
      'https://findyourbeauty.com.br/en/privacidade',
    );
    expect(legalUrl('https://dev.findyourbeauty.com.br', 'privacidade', 'es')).toBe(
      'https://dev.findyourbeauty.com.br/es/privacidade',
    );
  });
});
