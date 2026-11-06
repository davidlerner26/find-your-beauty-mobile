import { isCheckoutEnabled } from './features';

describe('isCheckoutEnabled', () => {
  it('follows the flag of the environment', () => {
    expect(isCheckoutEnabled({ features: { checkout: true } })).toBe(true);
    expect(isCheckoutEnabled({ features: { checkout: false } })).toBe(false);
  });
});

describe('environments', () => {
  const load = (appEnv?: string) => {
    let environment!: { features: { checkout: boolean; featuredProfessionals: boolean } };
    jest.isolateModules(() => {
      if (appEnv) process.env.EXPO_PUBLIC_APP_ENV = appEnv;
      else delete process.env.EXPO_PUBLIC_APP_ENV;
      environment = jest.requireActual('../config/environment').environment;
    });
    delete process.env.EXPO_PUBLIC_APP_ENV;
    return environment;
  };

  it('production has the payment screen and the featured professionals off, like the site', () => {
    const prod = load('prod');
    expect(prod.features.checkout).toBe(false);
    expect(prod.features.featuredProfessionals).toBe(false);
  });

  it('the test environment has them on', () => {
    expect(load().features.checkout).toBe(true);
  });
});
