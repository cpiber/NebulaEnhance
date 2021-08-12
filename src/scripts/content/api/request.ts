import { opt, refreshToken } from './store';

const request = async (url: string, init?: RequestInit) => {
  if (opt.auth === null)
    await refreshToken();

  while (true) {
    const auth = opt.auth ? { "Authorization": `Bearer ${opt.auth}` } : {};
    const i = Object.assign({}, init, {
      "credentials": "include",
      "headers": {
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en,en-US;q=0.5",
        "Nebula-Platform": "web",
        "Sec-GPC": "1",
        ...auth,
      },
      "mode": "cors"
    });

    const req = await fetch(url, i);
    const body = await req.json();

    if (body.detail !== 'Signature has expired')
      return body;
    
    await refreshToken();
  }
};

export const getVideo = (name: string) => request(`https://content.watchnebula.com/video/${name}/`, { 
  "referrer": `https://nebula.app/videos/${name}`,
  "method": "GET",
}) as Promise<Nebula.Video>;