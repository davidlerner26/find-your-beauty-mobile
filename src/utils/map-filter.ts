import { hasLocation, Professional } from '../models/professional';

// Professionals with an address on the map, filtered by the categories and by a service (from the home)
export const mapProfessionals = (
  professionals: Professional[],
  categories: string[],
  service: string | null,
) =>
  professionals.filter(
    (professional) =>
      hasLocation(professional) &&
      (!categories.length || professional.tags.some((tag) => categories.includes(tag))) &&
      (!service || professional.services.some((s) => s.name === service)),
  );
