import { Lang } from '../../shared/domain';

// The legal texts live on the site (one copy, in the three languages): the app opens them there
export const legalUrl = (siteUrl: string, page: 'privacidade' | 'termos', lang: Lang) =>
  `${siteUrl.replace(/\/$/, '')}${lang === 'pt' ? '' : `/${lang}`}/${page}`;
