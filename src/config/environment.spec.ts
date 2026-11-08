describe('environments', () => {
  const load = (appEnv?: string) => {
    let environment!: { features: { featuredProfessionals: boolean } };
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
});
