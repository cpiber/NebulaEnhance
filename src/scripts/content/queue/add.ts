import { video } from '../../helpers/VideoQueue';
import type { Queue } from './index';

export function addToStore(this: Queue, name: string, length: string, thumbnail: string, title: string, creator: string): Promise<video>;
export function addToStore(this: Queue, name: string): Promise<video>;
export function addToStore(this: Queue, name: string, ...args: any[]) {
  // promise always resolves to data from store
  if (this.store[name])
    return Promise.resolve(this.store[name]); // already in
  // either use data from arguments (all must be given) or request from api based on given name
  console.debug('Added video', args);
  return (args.length === 4 ? Promise.resolve(args as string[]) : requestData(name))
    .then(([length, thumbnail, title, creator]) => this.store[name] = { length, thumbnail, title, creator });
}

type thumb = {
  aspect_ratio: number,
  height: number,
  width: number,
  url: string,
  name: string,
};
type cat = {
  _id: string,
  category_id: string,
  title: string,
  value: string[],
};
const requestData = (name: string) =>
  // fetch video data from api and extract video object
  fetch(
    `https://api.zype.com/videos?friendly_title=${name}&per_page=1&api_key=JlSv9XTImxelHi-eAHUVDy_NUM3uAtEogEpEdFoWHEOl9SKf5gl9pCHB1AYbY3QF`,
    {
      "credentials": "omit",
      "headers": {
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.5",
        "Cache-Control": "max-age=0"
      },
      "referrer": `https://watchnebula.com/videos/${name}`,
      "method": "GET",
      "mode": "cors"
    }
  ).then(res => res.json())
    .then(data => {
      if (!data?.response?.length || data.response.length !== 1)
        throw new Error(`Invalid response: ${JSON.stringify(data)}`);
      const vid = data.response[0];
      return [
        `${Math.floor(vid.duration / 60)}:${(vid.duration - Math.floor(vid.duration / 60) * 60).pad(2)}`,
        (vid.thumbnails as thumb[])[0].url,
        vid.title,
        (vid.categories as cat[]).find(c => c.value.length).value[0]
      ] as string[];
    });