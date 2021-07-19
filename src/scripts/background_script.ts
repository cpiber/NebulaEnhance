import { getBrowserInstance } from './_sharedBrowser';
import { creator, creatorHasVideo, loadCreators as _loadCreators } from './_youtube';

const videoFetch = 50;

getBrowserInstance().browserAction.onClicked.addListener(() => {
  getBrowserInstance().tabs.create({
    'url': getBrowserInstance().runtime.getURL('options/index.html#standalone'),
    'active': true,
  });
});

getBrowserInstance().runtime.onMessage.addListener((message: string | { [key: string]: any }) => {
  if (typeof message === "string") message = { type: message };
  switch (message.type) {
    case "loadCreators":
      return loadCreators().then(console.debug);
    case "getYoutubeId":
      const s = (n: string) => n.trim().replaceAll(' ', '').toLowerCase();
      const c: string = message.creator;
      const c2 = s(c);
      const t: string = message.title;
      return loadCreators().then(creators => 
        creatorHasVideo(creators.find(e => e.name === c || s(e.name) === c2)?.uploads, t, videoFetch))
        .catch(err => { console.error(err); return Promise.reject(err); });
  }
});

const loadCreators = (() => {
  let promise: Promise<creator[]> = null;
  return () => {
    if (promise) return promise;
    return promise = _loadCreators();
  };
})();

(async () => {
  const yt: boolean = (await getBrowserInstance().storage.local.get({ youtube: false })).youtube;
  if (!yt) return;
  loadCreators().then(console.debug);
})();

getBrowserInstance().runtime.onInstalled.addListener(async (details) => {
  const show: boolean = (await getBrowserInstance().storage.local.get({ showChangelogs: true })).showChangelogs;
  const version: string = (await getBrowserInstance().storage.local.get({ lastVersion: "-1" })).lastVersion;
  console.log(show, version, details.reason);
  if (details.reason === 'install' || (show && version !== getBrowserInstance().runtime.getManifest().version)) {
    getBrowserInstance().tabs.create({
      'url': getBrowserInstance().runtime.getURL('options/index.html#standalone show-changelogs'),
      'active': false,
    });
  }
});