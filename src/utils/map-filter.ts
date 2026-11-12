import {
  categoryOfService,
  hasLocation,
  Professional,
  servicePartsOf,
} from '../models/professional';
import { INTL_LOCALE } from './locale';

const ALL_CATEGORIES = ['Maquiagem', 'Cabelo'];

// The services offered by the professionals of the map, in the chosen categories (the chips under the categories)
export const mapServiceTags = (professionals: Professional[], categories: string[]) => {
  const names = new Set<string>();
  for (const professional of professionals) {
    if (!hasLocation(professional)) continue;
    for (const service of professional.services) {
      if (categories.includes(service.category)) names.add(service.name);
      // The halves of a combo are services of makeup and of hair too
      for (const part of servicePartsOf(service.name)) {
        if (part !== service.name && categories.includes(categoryOfService(part))) names.add(part);
      }
    }
  }
  return [...names].sort((a, b) => a.localeCompare(b, INTL_LOCALE));
};

// Professionals with an address on the map, filtered by the categories and by the chosen services.
// No categories means every one; no services means every service; a service that is not offered any more is ignored.
export const mapProfessionals = (
  professionals: Professional[],
  categories: string[],
  services: string[],
) => {
  const tags = mapServiceTags(professionals, categories.length ? categories : ALL_CATEGORIES);
  const offered = services?.filter((name) => tags.includes(name));
  return professionals.filter(
    (professional) =>
      hasLocation(professional) &&
      (!categories.length || professional.tags.some((tag) => categories.includes(tag))) &&
      (!offered.length ||
        professional.services.some((s) =>
          servicePartsOf(s.name).some((part) => offered.includes(part)),
        )),
  );
};

// Closest first (who has no distance goes last), the same order on the map, in the carousel and in the list
export const nearestFirst = <T extends { km: number | null }>(cards: T[]) =>
  [...cards].sort((a, b) => (a.km ?? Infinity) - (b.km ?? Infinity));
