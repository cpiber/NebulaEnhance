import { Creator, loadCreators as _loadCreators, creatorHasNebulaVideo, creatorHasYTVideo, existsNebulaVideo, normalizeString } from './background';
import { BrowserMessage, getBrowserInstance, nebulavideo, parseTypeObject } from './helpers/sharedExt';

const videoFetchYt = 50;
const videoFetchNebula = 20;

getBrowserInstance().browserAction.onClicked.addListener(() => openOptions());

getBrowserInstance().runtime.onMessage.addListener(async (message: string | { [key: string]: any }) => {
  try {
    const msg = parseTypeObject(message);
    switch (msg.type) {
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
  const show: boolean = (await getBrowserInstance().storage.local.get({ showChangelogs: true })).showChangelogs;
  const version: string = (await getBrowserInstance().storage.local.get({ lastVersion: '-1' })).lastVersion;
  console.debug(show, version, details.reason);
  if (details.reason === 'install' || (show && version !== getBrowserInstance().runtime.getManifest().version))
    openOptions(false, 'show-changelogs');
});

const loadCreators = (() => {
  let promise: Promise<Creator[]> = null;
  return () => {
    if (promise) return promise;
    return promise = _loadCreators();
  };
})();

const getYoutubeId = async (message: { [key: string]: any }) => {
  const { creator, title } = message;
  const normalizedCreator = normalizeString(creator);

  try {
    const creators = await loadCreators();
    const uploads = creators.find(e => e.name === creator || normalizeString(e.name) === normalizedCreator)?.uploads;
    return creatorHasYTVideo(uploads, title, videoFetchYt);
  } catch (err) {
    console.error(err);
    return Promise.reject(err);
  }
};

const getNebulaVideo = async (message: { [key: string]: any }): Promise<nebulavideo> => {
  const { channelID, videoTitle } = message;

  const creators = await loadCreators();
  const creator = creators.find(c => c.channel === channelID);
  console.debug('creator:', creator);
  if (!creator) return;

  // try search the channel's newest videos locally
  if (creator.nebula) {
    try {
      const video = await creatorHasNebulaVideo(creator.nebula.split('/').pop(), videoTitle, videoFetchNebula);
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
  if (!creator.nebula) return;
  return {
    is: 'channel',
    link: creator.nebula,
  };
};

const openOptions = (active = true, ...args: string[]) => {
  getBrowserInstance().tabs.create({
    url: getBrowserInstance().runtime.getURL(`options.html#standalone ${args.join(' ')}`),
    active,
  });
};

(async () => {
  const yt: boolean = (await getBrowserInstance().storage.local.get({ youtube: false })).youtube;
  if (!yt) return;
  console.debug(await loadCreators());
})();