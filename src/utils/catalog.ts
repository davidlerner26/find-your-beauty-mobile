import { t } from '../i18n';
// The categories and the services of the catalog are saved in Portuguese (it is what the professionals pick
// and what the database has): this is how they are shown in the language of the page
const CATALOG: Record<string, string> = {
  Maquiagem: t('Maquiagem'),
  Cabelo: t('Cabelo'),
  'Maquiagem social': t('Maquiagem social'),
  'Maquiagem para festa': t('Maquiagem para festa'),
  'Maquiagem de noiva': t('Maquiagem de noiva'),
  'Maquiagem para madrinhas': t('Maquiagem para madrinhas'),
  'Maquiagem para formatura': t('Maquiagem para formatura'),
  'Maquiagem artística': t('Maquiagem artística'),
  'Maquiagem para fotos e ensaios': t('Maquiagem para fotos e ensaios'),
  'Automaquiagem (aula)': t('Automaquiagem (aula)'),
  'Design de sobrancelhas': t('Design de sobrancelhas'),
  'Aplicação de cílios': t('Aplicação de cílios'),
  'Corte feminino': t('Corte feminino'),
  'Corte masculino': t('Corte masculino'),
  Escova: t('Escova'),
  'Penteado para festa': t('Penteado para festa'),
  'Penteado de noiva': t('Penteado de noiva'),
  Coloração: t('Coloração'),
  'Mechas e luzes': t('Mechas e luzes'),
  Hidratação: t('Hidratação'),
  Cauterização: t('Cauterização'),
  Progressiva: t('Progressiva'),
  'Cronograma capilar': t('Cronograma capilar'),
};

export const catalogLabel = (name: string) => CATALOG[name] ?? name;

// "Corte feminino" -> "Women's haircut". A list is joined with " . ", like the tags of the cards.
export const catalogText = (value: string | string[] | null | undefined) => {
  if (Array.isArray(value)) return value.map(catalogLabel).join(' . ');
  return value ? catalogLabel(value) : '';
};
