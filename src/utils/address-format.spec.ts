import { formatAddress } from './address-format';

describe('formatAddress', () => {
  it('writes the address like Google does', () => {
    expect(
      formatAddress('afranio 141', {
        street: 'Av. Afrânio de Melo Franco',
        streetNumber: '141',
        district: 'Leblon',
        city: 'Rio de Janeiro',
        region: 'RJ',
        postalCode: '22430060',
      }),
    ).toBe('Av. Afrânio de Melo Franco, 141 - Leblon, Rio de Janeiro - RJ, 22430-060');
  });

  it('leaves out what is missing', () => {
    expect(formatAddress('x', { street: 'Rua A', city: 'Niterói' })).toBe('Rua A, Niterói');
  });

  it('keeps what was typed when there is no street or city', () => {
    expect(formatAddress('  Rua Tal, 10  ', undefined)).toBe('Rua Tal, 10');
    expect(formatAddress('Rua Tal, 10', { district: 'Centro' })).toBe('Rua Tal, 10');
  });
});
