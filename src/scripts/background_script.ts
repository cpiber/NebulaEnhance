import { Creator, loadCreators as _loadCreators, creatorHasNebulaVideo, creatorHasYTVideo, existsNebulaVideo, normalizeString } from './background';
import { purgeCache, purgeCacheIfNecessary } from './background/ext';
import type { CreatorSettings } from './content/nebula/creator-settings';
import { BrowserMessage, getBase, getBrowserInstance, getFromStorage, isChrome, nebulavideo, parseTimeString, parseTypeObject, setToStorage, toTimeString } from './helpers/sharedExt';
import { repairPlayerSettings } from './options/player';
import { Settings } from './page/components';

const videoFetchYt = 50;
const videoFetchNebula = 50;

const { local, sync } = getBrowserInstance().storage;

if (getBrowserInstance().action) {
  getBrowserInstance().action.onClicked.addListener(() => openOptions());
} else {
  getBrowserInstance().browserAction.onClicked.addListener(() => openOptions());
}

// NOTE: not promise-based, because Chrome really doesn't like it, when there are multiple listeners
// need to return immediately, then call sendResponse manually, otherwise the other listener in offscreen.ts interferes
getBrowserInstance().runtime.onMessage.addListener((message: string | { [key: string]: any; }, sender, sendResponse) => {
  // Return early if this message isn't meant for the background script
  if (typeof message !== 'string' && message.target !== undefined && message.target !== 'background') {
    return;
  }

  const keepAlive = setInterval(getBrowserInstance().runtime.getPlatformInfo, 25 * 1000);
  let ret: Promise<any>;
  try {
    const msg = parseTypeObject<{ type: string, name?: string; }>(message);
    if (__DEV__) console.log('Handling message', msg);
    switch (msg.type) {
      case BrowserMessage.INIT_PAGE:
        ret = openChangelog();
        break;
      case BrowserMessage.LOAD_CREATORS:
        ret = loadCreators();
        break;
      case BrowserMessage.GET_YTID:
        ret = getYoutubeId(msg);
        break;
      case BrowserMessage.GET_VID:
        ret = getNebulaVideo(msg);
        break;
    }
    if (ret) {
      ret.then(
        res => {
          if (__DEV__) console.log('Result for', msg.type, ':', res);
          sendResponse({ res });
        },
        err => {
          if (__DEV__) console.log('Error running', msg.type, ':', err);
          sendResponse({ err });
        },
      );
      return true;
    }
  } catch {
  } finally {
    clearInterval(keepAlive);
  }
});

getBrowserInstance().runtime.onInstalled.addListener(async (details) => {
  if (sync) {
    await sync.set(await local.get());
    await local.clear();
  }

  const { hiddenCreators, creatorSettings, playerSettings } = await getFromStorage({ hiddenCreators: [] as string[], creatorSettings: {} as Record<string, CreatorSettings>, playerSettings: {} as Partial<Settings> });
  if (Array.isArray(hiddenCreators) && hiddenCreators.length) {
    for (let c of hiddenCreators) {
      if (c.endsWith('/')) c = c.slice(0, -1);
      if (!(c in creatorSettings)) creatorSettings[c] = {};
      creatorSettings[c].hideCompletely = true;
    }
    await setToStorage({ creatorSettings });
    await (sync || local).remove('hiddenCreators');
  }
  repairPlayerSettings(playerSettings);
  await setToStorage({ playerSettings });

  if (details.reason === 'install') openOptions(true, 'show-changelogs');
});

let isHandlingChangelog = false;
const openChangelog = async () => {
  if (isHandlingChangelog) return;
  isHandlingChangelog = true;
  const { showChangelogs: show, lastVersion: version } = await getFromStorage({ showChangelogs: true, lastVersion: '-1' });
  console.debug({ show, version }, 'open changelogs?', show && version !== getBrowserInstance().runtime.getManifest().version);
  const actualVersion = getBrowserInstance().runtime.getManifest().version;
  if (show && version !== actualVersion) {
    openOptions(false, 'show-changelogs');
    await setToStorage({ lastVersion: actualVersion });
  }
  isHandlingChangelog = false;
};

let promise: Promise<Creator[]> = null;
const loadCreators = () => {
  if (promise) return promise;
  return promise = _loadCreators();
};

const getYoutubeId = async (message: { [key: string]: any; }) => {
  await purgeCacheIfNecessary();
  const { creator, title, nebula } = message;
  const normalizedCreator = normalizeString(creator || '');
  console.debug('creator:', creator, '\nnebula:', nebula, '\ntitle:', title);
  if (!creator && !nebula) throw 'not enough information';
  const creatorFinder = creator && nebula ?
    (e: Creator) => e.name === creator || normalizeString(e.name) === normalizedCreator || e.nebula === nebula || e.nebulaAlt == nebula :
    creator ?
      (e: Creator) => e.name === creator || normalizeString(e.name) === normalizedCreator :
      (e: Creator) => e.nebula === nebula || e.nebulaAlt == nebula;

  try {
    const creators = await loadCreators();
    const uploads = creators.find(creatorFinder)?.uploads;
    return creatorHasYTVideo(uploads, title, videoFetchYt);
  } catch (err) {
    console.error(err);
    return Promise.reject(err);
  }
};

const getNebulaVideo = async (message: { [key: string]: any; }): Promise<nebulavideo> => {
  await purgeCacheIfNecessary();
  const { channelID, channelName, videoTitle, channelNice } = message;
  if (!channelID && !channelName) throw 'not enough information';

  const creators = await loadCreators();
  const creator = creators.find(c => c.channel === channelID || c.name === channelName || c.name === channelNice || c.nebulaAlt === channelName);
  console.debug('creator:', creator, '\nchannelID:', channelID, '\nvideoTitle:', videoTitle);
  if (!creator) return;

  // try search the channel's newest videos locally
  if (creator.nebula) {
    try {
      const video = await creatorHasNebulaVideo(creator.nebula, videoTitle, videoFetchNebula);
      return {
        is: 'video',
        confidence: video.confidence,
        link: video.video,
      };
    } catch (err) {
      console.error(err);
    }
  }

  // try search the alternative channel's newest videos locally
  if (creator.nebulaAlt && creator.nebula !== creator.nebulaAlt) {
    try {
      const video = await creatorHasNebulaVideo(creator.nebulaAlt, videoTitle, videoFetchNebula);
      return {
        is: 'video',
        confidence: video.confidence,
        link: video.video,
      };
    } catch (err) {
      console.error(err);
    }
  }

  // fall back to site-wide search
  try {
    const video = await existsNebulaVideo(videoTitle, videoFetchNebula);
    return {
      is: 'search',
      confidence: video.confidence,
      link: video.video,
    };
  } catch (err) {
    console.error(err);
  }

  // last resort: link to channel
  if (!creator.nebula && !creator.nebulaAlt) return;
  return {
    is: 'channel',
    link: `https://${getBase()}/${creator.nebula || creator.nebulaAlt}`,
  };
};

const openOptions = (active = true, ...args: string[]) => {
  getBrowserInstance().tabs.create({
    url: getBrowserInstance().runtime.getURL(`options.html#standalone ${args.join(' ')}`),
    active,
  });
};

(async () => {
  const yt = (await getFromStorage({ youtube: false })).youtube;
  if (!yt) return;
  console.debug(await loadCreators());

  // debug code
  if (!__DEV__ || isChrome()) return;
  (window as any).loadCreators = loadCreators;
  Object.defineProperty(window, 'loadCreatorsPromise', {
    get: () => promise, set(v) {
      promise = v;
    },
  });
  (window as any).getYoutubeId = getYoutubeId;
  (window as any).getNebulaVideo = getNebulaVideo;
  (window as any).openChangelog = openChangelog;
  (window as any).openOptions = openOptions;
  (window as any).purgeCache = purgeCache;
  (window as any).parseTimeString = parseTimeString;
  (window as any).toTimeString = toTimeString;
})();