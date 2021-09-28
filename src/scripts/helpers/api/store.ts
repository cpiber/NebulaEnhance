import { NEBULA_AUTH_KEY, getCookie } from '../shared';

export const opt = {
  auth: null as string,
};

export const refreshToken = async () => {
  const cookie = getCookie(NEBULA_AUTH_KEY);
  let apiToken = '';
  try {
    ({ apiToken } = JSON.parse(cookie));
  } catch (e) {
    console.debug(e);
  }
  const apiAuth = apiToken ? { Authorization: `Token ${apiToken}` } : {};
  console.dev.debug('Refreshing nebula token using auth', apiAuth);

  const req = await fetch('https://api.watchnebula.com/api/v1/authorization/', {
    credentials: 'omit',
    headers: {
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.5',
      'Content-Type': 'application/json;charset=utf-8',
      ...apiAuth,
    },
    referrer: 'https://nebula.app/',
    body: '{}',
    method: 'POST',
    mode: 'cors',
  });
  const body = await req.json();
  return opt.auth = body.token as string;
};
