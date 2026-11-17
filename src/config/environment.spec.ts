describe('environments', () => {
  const load = (appEnv?: string) => {
    let environment!: {
      features: {
        featuredProfessionals: boolean;
        proSubscription: boolean;
        proSubscriptionSignup: boolean;
      };
    };
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

  // The Pro plan is ready in production (nothing shows while nobody subscribes), but nobody is told to subscribe until the owner
  // says to open the subscription (docs/assinatura-pro.md of the site). Opening it is the go-live: change
  // `proSubscriptionSignup` together with the checklist of that document.
  it('production is ready for the Pro plan but does not tell anyone to subscribe', () => {
    const { features } = load('prod');

    expect(features.proSubscription).toBe(true);
    expect(features.proSubscriptionSignup).toBe(false);
  });

  it('the test environment shows the Pro subscription and the way to subscribe', () => {
    const { features } = load();

    expect(features.proSubscription).toBe(true);
    expect(features.proSubscriptionSignup).toBe(true);
  });
});
