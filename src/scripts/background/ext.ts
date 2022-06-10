
import { getFromStorage, parseTimeString, setToStorage } from '../helpers/sharedExt';
import { purgeCache as purgeNebulaCache } from './nebula';
import { purgeCache as purgeYTCache } from './youtube';

export const purgeCache = async () => {
  purgeNebulaCache();
  purgeYTCache();
  console.debug('Purged video cache');
  await setToStorage({ lastpurged: new Date().getTime() });
};

export const purgeCacheIfNecessary = async () => {
  const { purgetime, lastpurged } = await getFromStorage({ purgetime: '6h', lastpurged: 0 });
  if (lastpurged === 0) return setToStorage({ lastpurged: new Date().getTime() });
  if (new Date(lastpurged + parseTimeString(purgetime) * 1000) >= new Date()) return; // time to purge is in future, time in ms
  await purgeCache();
};