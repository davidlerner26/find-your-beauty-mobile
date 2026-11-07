import { Professional, Service } from '../models/professional';
import { mapProfessionals, mapServiceTags, nearestFirst } from './map-filter';

const service = (name: string, category: Service['category'] = 'Cabelo') =>
  ({ id: name, name, category }) as Service;

const pro = (overrides: Partial<Professional>): Professional =>
  ({
    id: 'x',
    name: 'X',
    tags: ['Maquiagem'],
    serviceMode: 'studio',
    position: { lat: -22.9, lng: -43.2 },
    services: [service('Escova')],
    ...overrides,
  }) as Professional;

describe('mapProfessionals', () => {
  const ana = pro({ id: 'ana' });
  const bia = pro({ id: 'bia', tags: ['Cabelo'] });
  const home = pro({ id: 'home', serviceMode: 'home' });
  const nowhere = pro({ id: 'nowhere', position: { lat: 0, lng: 0 } });

  it('leaves out who has no address on the map', () => {
    expect(mapProfessionals([ana, home, nowhere], [], []).map((p) => p.id)).toEqual(['ana']);
  });

  it('filters by category', () => {
    expect(mapProfessionals([ana, bia], ['Cabelo'], []).map((p) => p.id)).toEqual(['bia']);
    expect(mapProfessionals([ana, bia], ['Cabelo', 'Maquiagem'], [])).toHaveLength(2);
  });

  it('filters by the chosen services', () => {
    const noService = pro({ id: 'none', services: [] });
    expect(mapProfessionals([ana, noService], [], ['Escova']).map((p) => p.id)).toEqual(['ana']);
  });

  it('keeps who offers any of the services', () => {
    const nails = pro({ id: 'nails', services: [service('Coloração')] });
    const other = pro({ id: 'other', services: [service('Hidratação')] });
    expect(
      mapProfessionals([ana, nails, other], [], ['Escova', 'Coloração']).map((p) => p.id),
    ).toEqual(['ana', 'nails']);
  });

  it('ignores a service that is not under the chosen categories', () => {
    const hair = pro({ id: 'hair', tags: ['Cabelo'] });
    const makeup = pro({
      id: 'makeup',
      tags: ['Cabelo'],
      services: [service('Maquiagem de noiva', 'Maquiagem')],
    });
    expect(mapProfessionals([hair, makeup], ['Cabelo'], ['Maquiagem de noiva'])).toHaveLength(2);
  });
});

describe('mapServiceTags', () => {
  it('lists the services of the categories, sorted and without repeating', () => {
    const a = pro({
      services: [service('Escova'), service('Coloração'), service('Noiva', 'Maquiagem')],
    });
    const b = pro({ services: [service('Escova')] });
    expect(mapServiceTags([a, b], ['Cabelo'])).toEqual(['Coloração', 'Escova']);
  });

  it('leaves out who is not on the map', () => {
    expect(mapServiceTags([pro({ serviceMode: 'home' })], ['Cabelo'])).toEqual([]);
  });
});

describe('nearestFirst', () => {
  it('sorts by distance and puts who has none last', () => {
    const cards = [
      { id: 'far', km: 5 },
      { id: 'none', km: null },
      { id: 'near', km: 1 },
    ];
    expect(nearestFirst(cards).map((c) => c.id)).toEqual(['near', 'far', 'none']);
  });
});
