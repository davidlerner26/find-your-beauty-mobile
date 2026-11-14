describe('environments', () => {
  const load = (appEnv?: string) => {
    let environment!: { features: { featuredProfessionals: boolean; proSubscription: boolean } };
    jest.isolateModules(() => {
      if (appEnv) process.env.EXPO_PUBLIC_APP_ENV = appEnv;
      else delete process.env.EXPO_PUBLIC_APP_ENV;
      environment = jest.requireActual('./environment').environment;
    });
    delete process.env.EXPO_PUBLIC_APP_ENV;
    return environment;
  };

  it('production has the featured professionals off, like the site', () => {
    expect(load('prod').features.featuredProfessionals).toBe(false);
  });

  it('the test environment has them on', () => {
    expect(load().features.featuredProfessionals).toBe(true);
  });

  // The Pro subscription stays in the test environment until the owner says to bring it to production
  // (docs/assinatura-pro.md of the site). Changing this is the go-live: change it together with the checklist of that
  // document.
  it('production has no Pro subscription: no badge, no featured rotation, no plan on the profile', () => {
    expect(load('prod').features.proSubscription).toBe(false);
  });

  it('the test environment shows the Pro subscription', () => {
    expect(load().features.proSubscription).toBe(true);
  });
});
