import { getCookie } from '../../helpers/shared';

export const opt = {
  auth: null as string,
};

export const refreshToken = async () => {
  const cookie = getCookie('nebula-auth');
  let apiToken: string = '';
  try {
    apiToken = JSON.parse(cookie).apiToken;
  } catch (e) {
    console.error(e);
  }
  const apiAuth = apiToken ? { "Authorization": `Token ${apiToken}` } : {};

  const req = await fetch("https://api.watchnebula.com/api/v1/authorization/", {
    "credentials": "include",
    "headers": {
      "Accept": "application/json, text/plain, */*",
      "Accept-Language": "en-US,en;q=0.5",
      "Content-Type": "application/json;charset=utf-8",
      ...apiAuth,
    },
    "referrer": "https://nebula.app/",
    "body": "{}",
    "method": "POST",
    "mode": "cors"
  });
  const body = await req.json();
  return opt.auth = body.token as string;
};
