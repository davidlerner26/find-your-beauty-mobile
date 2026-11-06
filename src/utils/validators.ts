import { t } from '../i18n';
import { errorCode } from './error-code';

const EMAIL = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;

export const isValidEmail = (email: string) => EMAIL.test(email.trim());

// At least 6 characters, with a letter, a number and a special character
export const isValidPassword = (password: string) =>
  password.length >= 6 &&
  /\p{L}/u.test(password) &&
  /\d/.test(password) &&
  /[^\p{L}\d\s]/u.test(password);

export const PASSWORD_RULE = t(
  'A senha precisa ter pelo menos 6 caracteres, com letras, 1 número e 1 caractere especial.',
);

const AUTH_ERRORS: Record<string, string> = {
  'auth/email-already-in-use': t('Este e-mail já está cadastrado.'),
  'auth/invalid-email': t('Digite um e-mail válido.'),
  'auth/weak-password': t('A senha é muito fraca.'),
  'auth/invalid-credential': t('E-mail ou senha incorretos.'),
  'auth/user-not-found': t('E-mail ou senha incorretos.'),
  'auth/wrong-password': t('E-mail ou senha incorretos.'),
  'auth/too-many-requests': t('Muitas tentativas. Tente novamente mais tarde.'),
  'auth/network-request-failed': t('Sem conexão. Verifique sua internet.'),
  'auth/pending-approval': t(
    'Seu cadastro ainda está em análise. Você poderá entrar assim que for aprovado.',
  ),
  'auth/not-professional': t('Esta conta não é de profissional. Use o login de cliente.'),
  'auth/professional-not-registered': t(
    'Esta conta do Google ainda não está cadastrada. Faça o cadastro de profissional primeiro.',
  ),
  'auth/account-is-client': t(
    'Esta conta do Google já é de cliente. Use outra conta para se cadastrar como profissional.',
  ),
  'auth/not-client': t('Esta conta é de profissional. Use o login da área profissional.'),
  'auth/expired-action-code': t('Este link expirou. Peça um novo link de redefinição.'),
  'auth/invalid-action-code': t(
    'Este link é inválido ou já foi usado. Peça um novo link de redefinição.',
  ),
  'auth/operation-not-allowed': t('Login por e-mail não está ativado no Firebase.'),
};

export const authErrorMessage = (error: unknown) =>
  AUTH_ERRORS[errorCode(error) ?? ''] ?? t('Algo deu errado. Tente novamente.');
