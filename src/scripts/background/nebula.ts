import { getChannelVideos } from '../helpers/api';
import { ytvideo } from '../helpers/shared';
import { creatorHasVideo } from './ifidf';
import { normalizeString } from './misc';
import { Video } from './types';

const plistcache: { [key: string]: Video[] } = {};
export const loadNebulaVideos = async (channel: string, num: number, title: string) => {
  if (!channel)
    throw 'Playlist empty';
  if (channel in plistcache && plistcache[channel].length >= num) {
    const vids = plistcache[channel].slice(0, num);
    return vids.find(i => normalizeString(i.title) === title)?.videoId || vids;
  }

  const videos: Video[] = (await getChannelVideos(channel, num)).map(v => ({ title: v.title, videoId: v.share_url }));

  plistcache[channel] = videos;
  return videos.find(i => normalizeString(i.title) === title)?.videoId || videos.slice(0, num);
};

const vidcache: { [key: string]: ytvideo } = {};
export const creatorHasNebulaVideo = (channel: string, title: string, num: number) => creatorHasVideo(vidcache, title, loadNebulaVideos.bind(null, channel, num));
