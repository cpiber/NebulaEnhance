import type { Video } from '.';
import { getBase, ytvideo } from '../helpers/shared';
import { creatorHasVideo } from './ifidf';
import { normalizeString } from './misc';

const plistcache: { [key: string]: Video[]; } = {};
export const loadYTVideos = async (playlist: string, num: number) => {
  if (!playlist)
    throw 'Playlist empty';
  if (playlist in plistcache && plistcache[playlist].length >= num)
    return plistcache[playlist].slice(0, num);

  const videos: Video[] = [];
  let page = null;

  do {
    const url = new URL('https://youtube.googleapis.com/youtube/v3/playlistItems');
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('playlistId', playlist);
    url.searchParams.set('key', __YT_API_KEY__);
    url.searchParams.set('maxResults', `${Math.min(num - videos.length, 50)}`);
    if (page)
      url.searchParams.set('pageToken', page);
    const u = url.toString();
    console.dev.debug('Fetching', u);
    const data = await fetch(u,
      {
        credentials: 'omit',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.5',
          'Cache-Control': 'max-age=0',
        },
        referrer: `https://${getBase()}/`,
        method: 'GET',
        mode: 'cors',
      });
    const res: YouTube.PlaylistItemsReply<YouTube.PlaylistItemSnippet> = await data.json();
    if (!res || !res.pageInfo || !res.items || !res.items.length)
      throw new Error('Invalid API response');
    const vids = res.items.map(i => ({ title: normalizeString(i.snippet.title), videoId: i.snippet.resourceId.videoId }));
    Array.prototype.push.apply(videos, vids);
    page = res.nextPageToken;
  } while (videos.length < num && page);

  return plistcache[playlist] = videos;
};

const vidcache: { [key: string]: ytvideo; } = {};
export const creatorHasYTVideo = (playlist: string, title: string, num: number) => creatorHasVideo(vidcache, title, loadYTVideos.bind(null, playlist, num));

export const purgeCache = () => {
  Object.keys(plistcache).forEach(key => delete plistcache[key]);
  Object.keys(vidcache).forEach(key => delete vidcache[key]);
};
