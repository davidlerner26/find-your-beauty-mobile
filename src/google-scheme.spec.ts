import { googleUrlScheme } from '../app.config';

describe('googleUrlScheme', () => {
  it('writes the iOS client id backwards', () => {
    expect(googleUrlScheme('508397329043-1ns5.apps.googleusercontent.com')).toBe(
      'com.googleusercontent.apps.508397329043-1ns5',
    );
  });
});
