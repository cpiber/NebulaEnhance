/**
 * Notes:
 * The 'page_size' parameter accepts up to 100.
 */

import type { Queue } from '../../content/queue';
import { getApiBase } from '../shared';

const request = async <T = any>(url: string, init?: RequestInit) => {
  const i = {
    ...init,
    credentials: 'omit' as const,
    headers: {
      ...init?.headers,
      'Accept': 'application/json, text/plain, */*',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept-Language': 'en,en-US;q=0.5',
      'Nebula-Platform': 'web',
      'Nebula-App-Version': '22.8.0',
    },
    mode: 'cors' as const,
  };

  console.dev.debug(`Fetching ${url}`, i);
  const req = await fetch(url, i);
  if (!req.ok) throw new Error(`Request failed: ${req.status} ${req.statusText}`);
  const body = await req.json();

  if (body.detail === 'You do not have permission to perform this action.')
    throw new Error('Permission denied');
  if (body.detail !== 'Signature has expired')
    return body as T;
  throw new Error(body.detail);
};

export const getVideo = (name: string) => request<Nebula.Video>(`https://content.api.${getApiBase()}/content/videos/${name}/`, {
  referrer: `https://${getApiBase()}/videos/${name}`,
  method: 'GET',
});

export const getChannel = async (name: string) => {
  try {
    return await request<Nebula.Channel>(`https://content.api.${getApiBase()}/content/${name}/`, {
      referrer: `https://${getApiBase()}/`,
      method: 'GET',
    });
  } catch { return null; }
};

export const getChannelVideos = async (name: string, num = Infinity) => {
  const channel = await getChannel(name);
  return getChannelVideosById(channel.id, num);
};
export const getChannelVideosById = async (id: string, num = Infinity) => {
  const vids: Nebula.Video[] = [];
  const req = new URL(`https://content.api.${getApiBase()}/video_channels/${id}/video_episodes/`);
  req.searchParams.set('page_size', `${Math.min(100, num)}`);
  let url = req.toString();

  while (url && vids.length < num) {
    const body = await request<Nebula.VideoRequest>(url);
    url = body.next;
    Array.prototype.push.apply(vids, body.results);
  }
  return vids;
};

export const enqueueChannelVideos = async (q: Queue, name: string) => {
  const channel = await getChannel(name);
  return enqueueChannelVideosById(q, channel.id);
};
export const enqueueChannelVideosById = async (q: Queue, id: string) => {
  const req = new URL(`https://content.api.${getApiBase()}/video_channels/${id}/video_episodes/`);
  req.searchParams.set('page_size', '100');
  let url = req.toString();
  // q.clear();

  while (url) {
    const body = await request<Nebula.VideoRequest>(url);
    url = body.next;
    const vids = body.results;
    const slugs = vids.map(v => v.slug);
    await q.addToStore(vids);
    q.enqueue(slugs);
  }
};

export const searchVideos = async (text: string, num = Infinity) => {
  const vids: Nebula.Video[] = [];
  const req = new URL(`https://content.api.${getApiBase()}/video_episodes/search/`);
  req.searchParams.set('q', text);
  req.searchParams.set('page_size', `${Math.min(100, num)}`);
  let url = req.toString();

  while (url && vids.length < num) {
    const body = await request<Nebula.VideoSearchRequest>(url, {
      referrer: `https://${getApiBase()}/`,
      method: 'GET',
    });
    url = body.next;
    Array.prototype.push.apply(vids, body.results);
  }
  return vids;
};