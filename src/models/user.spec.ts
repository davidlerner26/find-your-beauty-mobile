import { missingProfileData } from './user';

describe('missingProfileData', () => {
  it('lists everything when there is no profile', () => {
    expect(missingProfileData(null)).toEqual(['nome', 'sobrenome', 'celular', 'CPF', 'endereço']);
  });

  it('is empty when everything is filled in', () => {
    expect(
      missingProfileData({
        firstName: 'Ana',
        lastName: 'Silva',
        email: 'ana@example.com',
        phone: '(21) 99747-2878',
        cpf: '529.982.247-25',
        address: 'Rua A, 1',
      }),
    ).toEqual([]);
  });
});
