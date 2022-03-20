/**
 * Notes:
 * Nebula uses JWT. For simplicity, we simply request a new token every time, instead of refreshing the current one.
 * The 'page_size' parameter accepts up to 100.
 */

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
    if (!req.ok) throw new Error(`Request failed: ${req.status} ${req.statusText}`);
    const body = await req.json();

    if (body.detail === 'You do not have permission to perform this action.')
      throw new Error('Permission denied');
    if (body.detail !== 'Signature has expired')
      return body as T;

    await refreshToken();
  }
};

export const getVideo = (name: string) => request<Nebula.Video>(`https://content.watchnebula.com/video/${name}/`, {
  referrer: `https://nebula.app/videos/${name}`,
  method: 'GET',
});

export const getChannel = (name: string) => request<Nebula.Channel>(`https://content.watchnebula.com/slug/${name}/`, {
  referrer: 'https://nebula.app/',
  method: 'GET',
});

export const getChannelVideos = async (name: string, num = Infinity) => {
  const vids: Nebula.Video[] = [];
  const req = new URL(`https://content.watchnebula.com/video/channels/${name}/`);
  req.searchParams.set('page_size', `${Math.min(100, num)}`);
  let url = req.toString();

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
  const req = new URL(`https://content.watchnebula.com/video/channels/${name}/`);
  req.searchParams.set('page_size', '100');
  let url = req.toString();
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
  req.searchParams.set('page_size', `${Math.min(100, num)}`);
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