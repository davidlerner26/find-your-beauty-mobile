import { FRESH_MS, parseLastPosition, STALE_MS } from './last-position';

const saved = (at: number) => JSON.stringify({ position: { lat: -22.9, lng: -43.2 }, at });

describe('parseLastPosition', () => {
  const now = 1_700_000_000_000;

  it('reads a recent position', () => {
    expect(parseLastPosition(saved(now - FRESH_MS), now)?.position).toEqual({
      lat: -22.9,
      lng: -43.2,
    });
  });

  it('drops a position older than a day', () => {
    expect(parseLastPosition(saved(now - STALE_MS - 1), now)).toBeNull();
  });

  it('drops anything that is not a saved position', () => {
    expect(parseLastPosition(null, now)).toBeNull();
    expect(parseLastPosition('not json', now)).toBeNull();
    expect(parseLastPosition(JSON.stringify({ position: { lat: 'x' }, at: now }), now)).toBeNull();
  });
});
