import { Creator, loadCreators as _loadCreators, creatorHasNebulaVideo, creatorHasYTVideo, existsNebulaVideo, normalizeString } from './background';
import { BrowserMessage, getBrowserInstance, getFromStorage, nebulavideo, parseTypeObject, setToStorage } from './helpers/sharedExt';

const videoFetchYt = 50;
const videoFetchNebula = 50;

const { local, sync } = getBrowserInstance().storage;

getBrowserInstance().browserAction.onClicked.addListener(() => openOptions());

getBrowserInstance().runtime.onMessage.addListener(async (message: string | { [key: string]: any }) => {
  try {
    const msg = parseTypeObject(message);
    console.dev.log('Handling message', msg);
    switch (msg.type) {
      case BrowserMessage.INIT_PAGE:
        return openChangelog();
      case BrowserMessage.LOAD_CREATORS:
        return console.debug(await loadCreators());
      case BrowserMessage.GET_YTID:
        return getYoutubeId(msg);
      case BrowserMessage.GET_VID:
        return getNebulaVideo(msg);
    }
  } catch {}
});

getBrowserInstance().runtime.onInstalled.addListener(async (details) => {
  if (sync) {
    await sync.set(await local.get());
    await local.clear();
  }

  if (details.reason === 'install') openOptions(true, 'show-changelogs');
});

let isHandlingChangelog = false;
const openChangelog = async () => {
  if (isHandlingChangelog) return;
  isHandlingChangelog = true;
  const { showChangelogs: show, lastVersion: version } = await getFromStorage({ showChangelogs: true, lastVersion: '-1' });
  console.debug({ show, version }, 'open changelogs?', show && version !== getBrowserInstance().runtime.getManifest().version);
  const actualVersion = getBrowserInstance().runtime.getManifest().version;
  if (show && version !== actualVersion)
    openOptions(false, 'show-changelogs');
  await setToStorage({ lastVersion: actualVersion });
  isHandlingChangelog = false;
};

let promise: Promise<Creator[]> = null;
const loadCreators = () => {
  if (promise) return promise;
  return promise = _loadCreators();
};

const getYoutubeId = async (message: { [key: string]: any }) => {
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

const getNebulaVideo = async (message: { [key: string]: any }): Promise<nebulavideo> => {
  const { channelID, videoTitle } = message;
  if (!channelID) throw 'not enough information';

  const creators = await loadCreators();
  const creator = creators.find(c => c.channel === channelID);
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
    link: `https://nebula.app/${creator.nebula || creator.nebulaAlt}`,
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
  if (!__DEV__) return;
  (window as any).loadCreators = loadCreators;
  Object.defineProperty(window, 'loadCreatorsPromise', { get: () => promise, set(v) {
    promise = v;
  } });
  (window as any).getYoutubeId = getYoutubeId;
  (window as any).getNebulaVideo = getNebulaVideo;
  (window as any).openChangelog = openChangelog;
  (window as any).openOptions = openOptions;
})();