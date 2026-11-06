import { t } from '../i18n';
import { isValidCpf } from './cpf';
import { isValidEmail, isValidPassword, PASSWORD_RULE } from './validators';

// What each form checks, as functions of the values (the screens only show the messages). A field that is fine
// has no entry. The messages are the ones of the site.
export type Errors<Field extends string> = Partial<Record<Field, string>>;

export type LoginValues = { email: string; password: string };

export const validateLogin = ({ email, password }: LoginValues): Errors<keyof LoginValues> => ({
  ...(isValidEmail(email) ? {} : { email: t('Digite um e-mail válido.') }),
  ...(password ? {} : { password: t('Digite a senha.') }),
});

export type SignupValues = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  cpf: string;
  password: string;
};

export const validateSignup = (values: SignupValues): Errors<keyof SignupValues> => ({
  ...(values.firstName.trim().length >= 3
    ? {}
    : { firstName: t('O nome precisa ter pelo menos 3 caracteres.') }),
  ...(values.lastName.trim().length >= 2
    ? {}
    : { lastName: t('O sobrenome precisa ter pelo menos 2 caracteres.') }),
  ...(isValidEmail(values.email) ? {} : { email: t('Digite um e-mail válido.') }),
  // Mobile numbers have 11 digits: area code + 9 + 8 digits
  ...(values.phone.replace(/\D/g, '').length === 11
    ? {}
    : { phone: t('Digite o celular completo, com DDD e 9 dígitos.') }),
  ...(isValidCpf(values.cpf) ? {} : { cpf: t('Digite um CPF válido.') }),
  ...(isValidPassword(values.password) ? {} : { password: PASSWORD_RULE }),
});

export type ResetValues = { password: string; confirmation: string };

export const validateReset = ({
  password,
  confirmation,
}: ResetValues): Errors<keyof ResetValues> => ({
  ...(isValidPassword(password) ? {} : { password: PASSWORD_RULE }),
  ...(password === confirmation && confirmation
    ? {}
    : { confirmation: t('As senhas não são iguais.') }),
});

export const hasErrors = (errors: object) => Object.keys(errors).length > 0;

// The code of the e-mail: 4 digits
export const CODE_LENGTH = 4;
export const cleanCode = (text: string) => text.replace(/\D/g, '').slice(0, CODE_LENGTH);

// "01:05" for the time until another code can be asked for
export const clock = (seconds: number) =>
  `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
