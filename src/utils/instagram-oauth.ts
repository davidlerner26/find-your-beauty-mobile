// Where Instagram sends the professional back. Instagram only takes https addresses that are listed in the Meta app,
// so it is a page of the site (public/instagram-app) that hands the code over to the app by its link
// (findyourbeauty://pro/instagram). The trailing slash is part of the address and has to be written the same in the
// Meta app.
export const instagramRedirectUri = (siteUrl: string) =>
  `${siteUrl.replace(/\/+$/, '')}/instagram-app/`;

// The address that asks Instagram for the access (Instagram API with Instagram Login)
export const instagramAuthorizeUrl = (appId: string, redirectUri: string, state: string) => {
  const url = new URL('https://www.instagram.com/oauth/authorize');
  url.searchParams.set('client_id', appId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'instagram_business_basic');
  url.searchParams.set('state', state);
  return url.toString();
};

export type InstagramReturn =
  { ok: true; code: string; state: string | null } | { ok: false; reason: string };

// What Instagram sends back to the app (?code=...&state=... or ?error=...). It appends "#_" to the code.
export const parseInstagramReturn = (returned: string): InstagramReturn => {
  let url: URL;
  try {
    url = new URL(returned);
  } catch {
    return { ok: false, reason: '' };
  }
  const code = url.searchParams.get('code');
  if (!code) return { ok: false, reason: url.searchParams.get('error_description') ?? '' };
  return { ok: true, code: code.replace(/#_$/, ''), state: url.searchParams.get('state') };
};
