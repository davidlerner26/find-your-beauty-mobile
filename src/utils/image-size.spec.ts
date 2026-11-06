import { fitSize } from './image-size';

describe('fitSize', () => {
  it('caps the longest side and keeps the proportion', () => {
    expect(fitSize(4000, 3000)).toEqual({ width: 1280, height: 960 });
    expect(fitSize(3000, 4000)).toEqual({ width: 960, height: 1280 });
  });

  it('never makes a photo bigger', () => {
    expect(fitSize(800, 600)).toEqual({ width: 800, height: 600 });
  });
});
