import { getBrowserInstance } from './helpers/sharedBrowser';
import { Creator, creatorHasVideo, loadCreators as _loadCreators, normalizeString } from './helpers/youtube';

const videoFetch = 50;

getBrowserInstance().browserAction.onClicked.addListener(() => {
  openOptions();
});

getBrowserInstance().runtime.onMessage.addListener(async (message: string | { [key: string]: any }) => {
  if (typeof message === "string") message = { type: message };
  switch (message.type) {
    case "loadCreators":
      return console.debug(await loadCreators());
    case "getYoutubeId":
      return getYoutubeId(message);
  }
});

getBrowserInstance().runtime.onInstalled.addListener(async (details) => {
  const show: boolean = (await getBrowserInstance().storage.local.get({ showChangelogs: true })).showChangelogs;
  const version: string = (await getBrowserInstance().storage.local.get({ lastVersion: "-1" })).lastVersion;
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
  const creator: string = message.creator;
  const normalized_creator = normalizeString(creator);

  try {
    const creators = await loadCreators();
    const uploads = creators.find(e => e.name === creator || normalizeString(e.name) === normalized_creator)?.uploads;
    return creatorHasVideo(uploads, message.title, videoFetch);
  } catch (err) {
    console.error(err);
    return Promise.reject(err);
  }
};

const openOptions = (active = true, ...args: string[]) => {
  getBrowserInstance().tabs.create({
    'url': getBrowserInstance().runtime.getURL(`options.html#standalone ${args.join(' ')}`),
    active,
  });
};

(async () => {
  const yt: boolean = (await getBrowserInstance().storage.local.get({ youtube: false })).youtube;
  if (!yt) return;
  console.debug(await loadCreators());
})();