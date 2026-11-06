import { instagramAuthorizeUrl, parseInstagramReturn } from './instagram-oauth';

describe('instagramAuthorizeUrl', () => {
  it('asks for the basic permission with the app, the redirect and the state', () => {
    const url = new URL(instagramAuthorizeUrl('123', 'myapp://pro/instagram', 'abc'));
    expect(url.origin + url.pathname).toBe('https://www.instagram.com/oauth/authorize');
    expect(url.searchParams.get('client_id')).toBe('123');
    expect(url.searchParams.get('redirect_uri')).toBe('myapp://pro/instagram');
    expect(url.searchParams.get('response_type')).toBe('code');
    expect(url.searchParams.get('scope')).toBe('instagram_business_basic');
    expect(url.searchParams.get('state')).toBe('abc');
  });
});

describe('parseInstagramReturn', () => {
  it('reads the code and the state, without the "#_" Instagram appends', () => {
    expect(parseInstagramReturn('myapp://pro/instagram?code=xyz%23_&state=abc')).toEqual({
      ok: true,
      code: 'xyz',
      state: 'abc',
    });
    expect(parseInstagramReturn('myapp://pro/instagram?code=xyz#_&state=abc')).toMatchObject({
      ok: true,
      code: 'xyz',
    });
  });

  it('says why when there is no code', () => {
    expect(
      parseInstagramReturn('myapp://pro/instagram?error=access_denied&error_description=Negado'),
    ).toEqual({ ok: false, reason: 'Negado' });
    expect(parseInstagramReturn('not a url')).toEqual({ ok: false, reason: '' });
  });
});
