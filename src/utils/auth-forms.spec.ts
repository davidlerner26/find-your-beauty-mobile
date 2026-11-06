import {
  cleanCode,
  clock,
  hasErrors,
  validateLogin,
  validateProfile,
  validateReset,
  validateSignup,
} from './auth-forms';

const valid = {
  firstName: 'Ana',
  lastName: 'Silva',
  email: 'ana@example.com',
  phone: '(21) 99747-2878',
  cpf: '529.982.247-25',
  password: 'abc123!',
};

describe('validateLogin', () => {
  it('asks for a valid e-mail and a password', () => {
    expect(validateLogin({ email: 'ana@example.com', password: 'x' })).toEqual({});
    expect(Object.keys(validateLogin({ email: 'ana', password: '' }))).toEqual([
      'email',
      'password',
    ]);
  });
});

describe('validateSignup', () => {
  it('accepts valid values', () => {
    expect(hasErrors(validateSignup(valid))).toBe(false);
  });

  it('says which fields are wrong', () => {
    const errors = validateSignup({
      firstName: 'An',
      lastName: 'S',
      email: 'x',
      phone: '(21) 3974-2878',
      cpf: '111.111.111-11',
      password: 'abc',
    });
    expect(Object.keys(errors)).toEqual([
      'firstName',
      'lastName',
      'email',
      'phone',
      'cpf',
      'password',
    ]);
  });

  it('ignores spaces around the names', () => {
    expect(validateSignup({ ...valid, firstName: ' An ' }).firstName).toBeDefined();
  });
});

describe('validateReset', () => {
  it('needs a valid password and the same confirmation', () => {
    expect(validateReset({ password: 'abc123!', confirmation: 'abc123!' })).toEqual({});
    expect(validateReset({ password: 'abc123!', confirmation: '' }).confirmation).toBeDefined();
    expect(
      validateReset({ password: 'abc123!', confirmation: 'other' }).confirmation,
    ).toBeDefined();
    expect(validateReset({ password: 'abc', confirmation: 'abc' }).password).toBeDefined();
  });
});

describe('code', () => {
  it('keeps 4 digits from whatever is typed or pasted', () => {
    expect(cleanCode('12 34-5678')).toBe('1234');
    expect(cleanCode('ab')).toBe('');
  });

  it('writes the wait as mm:ss', () => {
    expect(clock(60)).toBe('01:00');
    expect(clock(5)).toBe('00:05');
  });
});

describe('validateProfile', () => {
  const profile = {
    firstName: 'Ana',
    lastName: 'Silva',
    phone: '(21) 99747-2878',
    cpf: '529.982.247-25',
  };

  it('accepts a complete profile, without asking for the e-mail or the password', () => {
    expect(validateProfile(profile)).toEqual({});
  });

  it('says which fields are wrong', () => {
    expect(Object.keys(validateProfile({ ...profile, firstName: '', cpf: '1' }))).toEqual([
      'firstName',
      'cpf',
    ]);
  });
});
