import { creatorLocation, durationLocation, titleLocation } from '../../helpers/locations';
import { video } from '../../helpers/VideoQueue';
import type { Queue } from './index';

export async function addToStore(this: Queue, name: string, el?: HTMLElement): Promise<video> {
  console.debug('Added video', name);
  if (!(el instanceof HTMLElement)) {
    if (this.store[name])
      return this.store[name];
    return this.store[name] = await requestData(name);
  }
  const img = el.querySelector('img');
  return this.store[name] = {
    length: durationLocation(img)?.lastChild.textContent,
    thumbnail: img.src,
    title: titleLocation(el)?.textContent,
    creator: creatorLocation(el)?.textContent,
  };
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
const requestData = async (name: string) => {
  // fetch video data from api and extract video object
  const data = await fetch(
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
  ).then(res => res.json());

  if (!data?.response?.length || data.response.length !== 1)
    throw new Error(`Invalid response: ${JSON.stringify(data)}`);
  const vid = data.response[0];
  const minutes = Math.floor(vid.duration / 60);
  return {
    length: `${minutes}:${(vid.duration - minutes * 60).pad(2)}`,
    thumbnail: (vid.thumbnails as thumb[])[0].url,
    title: vid.title,
    creator: (vid.categories as cat[]).find(c => c.value.length).value[0]
  };
};