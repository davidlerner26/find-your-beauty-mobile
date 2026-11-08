// The addresses of the screens, as the files of src/app name them (the same addresses as the site).
// Use these instead of writing the text again.
export const PATHS = {
  home: '/',
  explore: '/explore',
  search: '/busca',
  login: '/entrar',
  signup: '/cadastro',
  verifyEmail: '/verificar-email',
  agenda: '/agenda',
  admin: '/admin',
  // The professional area
  proHome: '/pro',
  proLogin: '/pro/entrar',
  proSignup: '/pro/cadastro',
  proProfile: '/pro/perfil',
  proMessages: '/pro/mensagens',
  proNotifications: '/pro/notificacoes',
  // The page of a professional, and its booking screen
  professionals: '/profissionais',
  professional: (id: string) => `/profissionais/${id}`,
  booking: (id: string) => `/profissionais/${id}/agendar`,
  // The cards of the client
  cards: '/cartoes',
} as const;
