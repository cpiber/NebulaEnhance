import type { Queue } from '../../content/queue';
import { opt, refreshToken } from './store';

const request = async <T = any>(url: string, init?: RequestInit) => {
  if (opt.auth === null)
    await refreshToken();

  while (true) {
    const auth = opt.auth ? { Authorization: `Bearer ${opt.auth}` } : {};
    const i = {
      ...init,
      credentials: 'omit' as const,
      headers: {
        ...init.headers,
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en,en-US;q=0.5',
        'Nebula-Platform': 'web',
        ...auth,
      },
      mode: 'cors' as const,
    };

    const req = await fetch(url, i);
    const body = await req.json();

    if (body.detail !== 'Signature has expired' && body.detail !== 'You do not have permission to perform this action.')
      return body as T;

    await refreshToken();
  }
};

export const getVideo = (name: string) => request<Nebula.Video>(`https://content.watchnebula.com/video/${name}/`, {
  referrer: `https://nebula.app/videos/${name}`,
  method: 'GET',
});

export const getChannelVideos = async (name: string, num = Infinity) => {
  const vids: Nebula.Video[] = [];
  let url = `https://content.watchnebula.com/video/channels/${name}`;

  while (url && vids.length < num) {
    const body = await request<Nebula.VideoRequest>(url, {
      referrer: `https://nebula.app/${name}`,
      method: 'GET',
    });
    url = body.episodes.next;
    Array.prototype.push.apply(vids, body.episodes.results);
  }
  return vids;
};

export const enqueueChannelVideos = async (q: Queue, name: string) => {
  let url = `https://content.watchnebula.com/video/channels/${name}`;
  // q.clear();

  while (url) {
    const body = await request<Nebula.VideoRequest>(url, {
      referrer: `https://nebula.app/${name}`,
      method: 'GET',
    });
    url = body.episodes.next;
    const vids = body.episodes.results;
    const slugs = vids.map(v => v.slug);
    await q.addToStore(vids);
    q.enqueue(slugs);
  }
};

export const searchVideos = async (text: string, num = Infinity) => {
  const vids: Nebula.Video[] = [];
  const req = new URL('https://content.watchnebula.com/search/video/');
  req.searchParams.set('text', text);
  let url = req.toString();

  while (url && vids.length < num) {
    const body = await request<Nebula.VideoSearchRequest>(url, {
      referrer: 'https://nebula.app/',
      method: 'GET',
    });
    url = body.next;
    Array.prototype.push.apply(vids, body.results);
  }
  return vids;
};