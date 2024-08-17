import type { Video } from '.';
import { getChannelVideos, searchVideos } from '../helpers/api';
import { ytvideo } from '../helpers/shared';
import { creatorHasVideo } from './ifidf';
import { normalizeString } from './normalize';

const plistcache: { [key: string]: Video[]; } = {};
export const loadNebulaChannelVideos = async (channel: string, num: number) => {
  if (!channel)
    throw 'Playlist empty';
  if (channel in plistcache && plistcache[channel].length >= num)
    return plistcache[channel].slice(0, num);

  const videos: Video[] = (await getChannelVideos(channel, num)).map(v => ({ title: normalizeString(v.title), videoId: v.share_url }));

  plistcache[channel] = videos;
  return videos.slice(0, num);
};

const searchcache: { [key: string]: Video[]; } = {};
export const loadNebulaSearchVideos = async (text: string, num: number) => {
  if (!text)
    throw 'Search empty';
  if (text in searchcache && searchcache[text].length >= num)
    return searchcache[text].slice(0, num);

  const videos: Video[] = (await searchVideos(text, num)).map(v => ({ title: normalizeString(v.title), videoId: v.share_url }));

  searchcache[text] = videos;
  return videos.slice(0, num);
};

const vidcache: { [key: string]: ytvideo; } = {};
export const creatorHasNebulaVideo = (channel: string, title: string, num: number) => creatorHasVideo(vidcache, title, loadNebulaChannelVideos.bind(null, channel, num));
const searchvidcache: { [key: string]: ytvideo; } = {};
export const existsNebulaVideo = (title: string, num: number) => creatorHasVideo(searchvidcache, title, loadNebulaSearchVideos.bind(null, title, num));

export const purgeCache = () => {
  Object.keys(plistcache).forEach(key => delete plistcache[key]);
  Object.keys(searchcache).forEach(key => delete searchcache[key]);
  Object.keys(vidcache).forEach(key => delete vidcache[key]);
  Object.keys(searchvidcache).forEach(key => delete searchvidcache[key]);
};
