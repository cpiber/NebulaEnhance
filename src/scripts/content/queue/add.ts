import { creatorLocation, durationLocation, titleLocation } from '../../helpers/locations';
import { video } from '../../helpers/VideoQueue';
import { getVideo } from '../api';
import type { Queue } from './index';

export async function addToStore(this: Queue, name: string, el?: HTMLElement): Promise<video>;
export async function addToStore(this: Queue, name: Nebula.Video[]): Promise<video[]>;
export async function addToStore(this: Queue, name: string | Nebula.Video[], el?: HTMLElement): Promise<video | video[]> {
  if (typeof name !== "string") {
    return name.map(v => this.store[v.slug] = extractData(v));
  }

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

const requestData = async (name: string) => {
  const data = await getVideo(name);

  if (!data?.slug || data.slug !== name)
    throw new Error(`Invalid response: ${JSON.stringify(data)}`);
  return extractData(data);
};

export const extractData = (data: Nebula.Video) => {
  const minutes = Math.floor(data.duration / 60);
  const t = Object.keys(data.assets.thumbnail);
  const highest = t[t.length - 1];
  return {
    length: `${minutes}:${(data.duration - minutes * 60).pad(2)}`,
    thumbnail: data.assets.thumbnail[highest].original,
    title: data.title,
    creator: data.channel_title,
  };
};