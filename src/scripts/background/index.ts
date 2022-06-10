export * from './misc';
export * from './nebula';
export * from './youtube';

import { getFromStorage, parseTimeString, setToStorage } from '../helpers/sharedExt';
import { purgeCache as purgeNebulaCache } from './nebula';
import { purgeCache as purgeYTCache } from './youtube';

export type Creator = {
  name: string,
  nebula: string,
  nebulaAlt: string,
  channel: string,
  uploads: string,
};
export type Video = {
  title: string,
  videoId: string,
};

export const purgeCache = () => {
  purgeNebulaCache();
  purgeYTCache();
  console.debug('Purged video cache');
};

export const purgeCacheIfNecessary = async () => {
  const { purgetime, lastpurged } = await getFromStorage({ purgetime: '6h', lastpurged: 0 });
  if (lastpurged === 0) return setToStorage({ lastpurged: new Date().getTime() });
  if (new Date(lastpurged + parseTimeString(purgetime) * 1000) >= new Date()) return; // time to purge is in future, time in ms
  purgeCache();
  await setToStorage({ lastpurged: new Date().getTime() });
};