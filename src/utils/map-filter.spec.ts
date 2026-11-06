import { Professional } from '../models/professional';
import { mapProfessionals } from './map-filter';

const pro = (overrides: Partial<Professional>): Professional =>
  ({
    id: 'x',
    name: 'X',
    tags: ['Maquiagem'],
    serviceMode: 'studio',
    position: { lat: -22.9, lng: -43.2 },
    services: [{ id: 's', name: 'Escova' }],
    ...overrides,
  }) as Professional;

describe('mapProfessionals', () => {
  const ana = pro({ id: 'ana' });
  const bia = pro({ id: 'bia', tags: ['Cabelo'] });
  const home = pro({ id: 'home', serviceMode: 'home' });
  const nowhere = pro({ id: 'nowhere', position: { lat: 0, lng: 0 } });

  it('leaves out who has no address on the map', () => {
    expect(mapProfessionals([ana, home, nowhere], [], null).map((p) => p.id)).toEqual(['ana']);
  });

  it('filters by category', () => {
    expect(mapProfessionals([ana, bia], ['Cabelo'], null).map((p) => p.id)).toEqual(['bia']);
    expect(mapProfessionals([ana, bia], ['Cabelo', 'Maquiagem'], null)).toHaveLength(2);
  });

  it('filters by service', () => {
    const noService = pro({ id: 'none', services: [] });
    expect(mapProfessionals([ana, noService], [], 'Escova').map((p) => p.id)).toEqual(['ana']);
  });
});
