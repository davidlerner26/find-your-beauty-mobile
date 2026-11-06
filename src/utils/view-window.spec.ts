import { shouldCountView, VIEW_WINDOW_MS } from './view-window';

describe('shouldCountView', () => {
  const now = 1_000_000_000;

  it('counts the first visit and records it', () => {
    expect(shouldCountView({}, 'ana', now)).toEqual({ count: true, stored: { ana: now } });
  });

  it('does not count again inside the window', () => {
    const stored = { ana: now - 60_000 };
    expect(shouldCountView(stored, 'ana', now)).toEqual({ count: false, stored });
  });

  it('counts again after the window, and forgets the old ones of other professionals', () => {
    const stored = {
      ana: now - VIEW_WINDOW_MS - 1,
      bia: now - VIEW_WINDOW_MS - 5,
      caio: now - 1000,
    };
    expect(shouldCountView(stored, 'ana', now)).toEqual({
      count: true,
      stored: { caio: now - 1000, ana: now },
    });
  });
});
