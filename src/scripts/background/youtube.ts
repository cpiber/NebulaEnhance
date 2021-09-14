import { ytvideo } from '../helpers/shared';
import { creatorHasVideo } from './ifidf';
import { normalizeString } from './misc';
import { Video } from './types';

const plistcache: { [key: string]: Video[] } = {};
export const loadYTVideos = async (playlist: string, title: string, num: number) => {
  if (!playlist)
    throw 'Playlist empty';
  if (playlist in plistcache && plistcache[playlist].length >= num) {
    const vids = plistcache[playlist].slice(0, num);
    return vids.find(i => normalizeString(i.title) === title)?.videoId || vids;
  }

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
    const data = await fetch(url.toString(),
      {
        credentials: 'omit',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.5',
          'Cache-Control': 'max-age=0',
        },
        referrer: 'https://nebula.app/',
        method: 'GET',
        mode: 'cors',
      });
    const res: YouTube.PlaylistItemsReply<YouTube.PlaylistItemSnippet> = await data.json();
    if (!res || !res.pageInfo || !res.items || !res.items.length)
      throw new Error('Invalid API response');
    const vids = res.items.map(i => ({ title: i.snippet.title, videoId: i.snippet.resourceId.videoId }));
    Array.prototype.push.apply(videos, vids);
    page = res.nextPageToken;
  } while (videos.length < num && page);

  plistcache[playlist] = videos;
  return videos.find(i => normalizeString(i.title) === title)?.videoId || videos;
};

const vidcache: { [key: string]: ytvideo } = {};
export const creatorHasYTVideo = (playlist: string, title: string, num: number) => creatorHasVideo(vidcache, () => loadYTVideos(playlist, title, num), title);
