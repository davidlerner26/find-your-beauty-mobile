import { toPlace, toSuggestions } from './places';

describe('toSuggestions', () => {
  it('keeps the place predictions with an id and a text', () => {
    expect(
      toSuggestions({
        suggestions: [
          {
            placePrediction: {
              placeId: 'a',
              text: { text: 'Rua A, 1 - Leblon, Rio de Janeiro - RJ' },
            },
          },
          { placePrediction: { placeId: 'b' } },
          {},
        ],
      }),
    ).toEqual([{ id: 'a', text: 'Rua A, 1 - Leblon, Rio de Janeiro - RJ' }]);
  });

  it('is empty when Google has no suggestions', () => {
    expect(toSuggestions({})).toEqual([]);
  });
});

describe('toPlace', () => {
  it('has the address as Google writes it and the position', () => {
    expect(
      toPlace(
        { formattedAddress: 'Rua A, 1', location: { latitude: -22.9, longitude: -43.2 } },
        'x',
      ),
    ).toEqual({ address: 'Rua A, 1', position: { lat: -22.9, lng: -43.2 } });
  });

  it('uses the text of the suggestion when there is no formatted address', () => {
    expect(toPlace({ location: { latitude: 1, longitude: 2 } }, 'Rua B')?.address).toBe('Rua B');
  });

  it('is null without a position on the map', () => {
    expect(toPlace({ formattedAddress: 'Rua C' }, 'Rua C')).toBeNull();
  });
});
