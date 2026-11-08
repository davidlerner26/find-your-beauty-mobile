import { dragPosition } from './photo-position';

const frame = { width: 320, height: 180 };

describe('dragPosition', () => {
  it('moves the focus the other way and by the share of the photo that sticks out', () => {
    // 4:3 photo: scaled to 320 wide it is 240 tall, so 60 px stick out vertically
    const moved = dragPosition({ x: 50, y: 50 }, { dx: 0, dy: 30 }, frame, {
      width: 4000,
      height: 3000,
    });
    expect(moved).toEqual({ x: 50, y: 0 });
  });

  it('does not move an axis where the photo fits the frame', () => {
    const moved = dragPosition({ x: 50, y: 50 }, { dx: 40, dy: 10 }, frame, {
      width: 1600,
      height: 900,
    });
    expect(moved).toEqual({ x: 50, y: 50 });
  });

  it('stays between 0 and 100', () => {
    const moved = dragPosition({ x: 90, y: 10 }, { dx: -500, dy: 500 }, frame, {
      width: 6000,
      height: 1000,
    });
    expect(moved).toEqual({ x: 100, y: 10 });
  });

  it('keeps the position while the size of the photo is unknown', () => {
    expect(
      dragPosition({ x: 20, y: 30 }, { dx: 10, dy: 10 }, frame, { width: 0, height: 0 }),
    ).toEqual({
      x: 20,
      y: 30,
    });
  });
});
